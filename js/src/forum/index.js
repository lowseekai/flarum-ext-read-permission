import app from 'flarum/forum/app';
import {override, extend} from 'flarum/common/extend';
import Badge from 'flarum/common/components/Badge';
import listItems from 'flarum/common/helpers/listItems';
import highlight from 'flarum/common/helpers/highlight';
import ReadFailedModal from './components/ReadFailedModal';
import addComposerItems from './addComposerItems';

const DISCUSSION_LIST_ITEM = 'flarum/forum/components/DiscussionListItem';
const DISCUSSION_PAGE = 'flarum/forum/components/DiscussionPage';
const POST = 'flarum/forum/components/Post';
const DISCUSSION = 'flarum/common/models/Discussion';

function requiredPermission(model) {
  return Number(model?.attribute('readPermission') || 0);
}

function userPermission(user) {
  return Number(user?.attribute('readPermission') || 0);
}

function groupNameForPermission(permission) {
  return app.store
    .all('groups')
    .filter(
      (group) =>
        Number(group.attribute('readPermission') ?? group.data?.attributes?.readPermission ?? 0) ===
        permission
    )
    .sort((a, b) => a.namePlural().localeCompare(b.namePlural()))[0]
    ?.namePlural();
}

function isDiscussionOwner(discussion, user) {
  const owner = discussion?.user();
  return !!(owner && user && owner.id() === user.id());
}

function canReadDiscussion(discussion) {
  const required = requiredPermission(discussion);

  if (required <= 0) {
    return true;
  }

  const user = app.session?.user;

  return !!(
    user &&
    (user.isAdmin() || isDiscussionOwner(discussion, user) || userPermission(user) >= required)
  );
}

function blockedDiscussionView(component, discussion) {
  const permission = requiredPermission(discussion);

  component.permissionModal = (event) => {
    event.preventDefault();
    app.modal.show(ReadFailedModal, {readPermission: permission});
  };

  return (
    <a
      href="#"
      onclick={component.permissionModal}
      className="DiscussionListItem-main ReadPermission-blockedDiscussion"
    >
      <h2 className="DiscussionListItem-title">
        {highlight(discussion.title(), component.highlightRegExp)}
      </h2>
      <ul className="DiscussionListItem-info">
        {listItems(component.infoItems().toArray())}
      </ul>
    </a>
  );
}

function blockedPageView(discussion) {
  const groupName = groupNameForPermission(requiredPermission(discussion));

  return (
    <div className="DiscussionPage ReadPermission-blockedPage">
      <div className="DiscussionPage-discussion">
        <header className="Hero DiscussionHero DiscussionHero--colored text-contrast--dark">
          <div className="container">
            <ul className="DiscussionHero-items">
              <li className="item-title">
                <h1 className="DiscussionHero-title">
                  {groupName
                    ? app.translator.trans('nodeloc-read-permission.forum.low-permission', {
                        group: groupName,
                      })
                    : app.translator.trans('nodeloc-read-permission.forum.low-permission-unknown')}
                </h1>
              </li>
            </ul>
          </div>
        </header>
      </div>
    </div>
  );
}

app.initializers.add('nodeloc/flarum-ext-read-permission', () => {
  addComposerItems();

  // Add a visible marker to restricted discussions without changing the
  // normal discussion badge list for unrestricted topics.
  extend(DISCUSSION, 'badges', function (badges) {
    const permission = requiredPermission(this);

    if (permission > 0) {
      const groupName = groupNameForPermission(permission);

      badges.add(
        'readPermission',
        <Badge
          type="readPermission"
          icon="fas fa-eye-slash"
          label={
            groupName
              ? app.translator.trans('nodeloc-read-permission.forum.tooltip.badge', {
                  group: groupName,
                })
              : app.translator.trans('nodeloc-read-permission.forum.tooltip.badge-unknown')
          }
        />,
        5
      );
    }
  });

  override(DISCUSSION_LIST_ITEM, 'mainView', function (original) {
    const discussion = this.attrs.discussion;

    if (!canReadDiscussion(discussion)) {
      return blockedDiscussionView(this, discussion);
    }

    return original();
  });

  override(DISCUSSION_PAGE, 'view', function (original) {
    const discussion = this.discussion;

    if (discussion && !canReadDiscussion(discussion)) {
      return blockedPageView(discussion);
    }

    return original();
  });

  override(POST, 'view', function (original) {
    const post = this.attrs.post;
    const discussion = post?.discussion();

    if (discussion && !canReadDiscussion(discussion)) {
      const groupName = groupNameForPermission(requiredPermission(discussion));

      return (
        <div className="Post-body ReadPermission-blockedPost">
          {groupName
            ? app.translator.trans('nodeloc-read-permission.forum.low-permission', {
                group: groupName,
              })
            : app.translator.trans('nodeloc-read-permission.forum.low-permission-unknown')}
        </div>
      );
    }

    return original();
  });
});
