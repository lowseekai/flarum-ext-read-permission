import app from 'flarum/forum/app';
import {extend} from 'flarum/common/extend';
import Icon from 'flarum/common/components/Icon';
import CreateReadPermissionModal from './components/CreateReadPermissionModal';

function permissionForGroup(group) {
  return Number(group?.attribute('readPermission') ?? group?.data?.attributes?.readPermission ?? 0);
}

function findChildByClassName(vnode, className) {
  if (!vnode) {
    return null;
  }

  const classes = vnode?.attrs?.className;

  if (typeof classes === 'string' && classes.split(/\s+/).includes(className)) {
    return vnode;
  }

  if (!Array.isArray(vnode.children)) {
    return null;
  }

  return (
    vnode.children.find((child) => {
      const childClasses = child?.attrs?.className;

      return (
        typeof childClasses === 'string' &&
        childClasses.split(/\s+/).includes(className)
      );
    }) ?? null
  );
}

function showReadPermissionModal(composer, event) {
  event?.preventDefault();
  event?.stopPropagation();

  app.modal.show(CreateReadPermissionModal, {
    selectGroup: composer.fields.selectGroup,
    onsubmit: (selectGroup) => {
      composer.fields.selectGroup = selectGroup;
      composer.fields.readPermission = permissionForGroup(selectGroup);
      m.redraw();
    },
  });
}

export default () => {
  const componentPath = 'flarum/forum/components/DiscussionComposer';

  extend(componentPath, 'oninit', function () {
    if (!Object.prototype.hasOwnProperty.call(this.composer.fields, 'readPermission')) {
      this.composer.fields.readPermission = null;
    }

    this.addReadPermission = (event) => showReadPermissionModal(this.composer, event);
  });

  extend(componentPath, 'headerItems', function (items) {
    const selectedGroup = this.composer.fields.selectGroup;
    const labelKey = selectedGroup ? 'edit' : 'add';

    items.add(
      'readPermission',
      <button
        type="button"
        className="Button Button--ua-reset ComposerBody-readPermission"
        onclick={(event) => showReadPermissionModal(this.composer, event)}
      >
        <span className={selectedGroup ? 'ReadPermissionLabel' : 'ReadPermissionLabel none'}>
          <Icon name="fas fa-eye-slash" />
          {app.translator.trans(`nodeloc-read-permission.forum.composer_discussion.${labelKey}_readPermission`)}
        </span>
      </button>,
      4
    );

  });

  extend(componentPath, 'view', function (vnode) {
    if (!this.composer.fields.selectGroup) {
      return;
    }

    const body = findChildByClassName(vnode?.children?.[0], 'ComposerBody');
    const content = findChildByClassName(body, 'ComposerBody-content');
    const editor = findChildByClassName(content, 'ComposerBody-editor');

    if (!Array.isArray(content?.children) || !editor) {
      return;
    }

    content.children.splice(content.children.indexOf(editor), 0, (
      <div key="read-permission-hint" className="ReadPermissionComposerHint" role="status">
        <Icon name="fas fa-circle-info" />
        <span>{app.translator.trans('nodeloc-read-permission.forum.composer_discussion.editing_hint')}</span>
      </div>
    ));
  });

  extend(componentPath, 'data', function (data) {
    const selectedGroup = this.composer.fields.selectGroup;

    if (selectedGroup) {
      data.readPermission = Number(
        this.composer.fields.readPermission ?? permissionForGroup(selectedGroup)
      );
    }
  });
};
