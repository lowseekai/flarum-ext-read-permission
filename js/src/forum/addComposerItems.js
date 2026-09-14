import app from 'flarum/forum/app';
import {extend} from 'flarum/common/extend';
import classList from 'flarum/common/utils/classList';
import CreateReadPermissionModal from './components/CreateReadPermissionModal';

function showReadPermissionModal(composer, event) {
  event?.preventDefault();
  event?.stopPropagation();

  app.modal.show(CreateReadPermissionModal, {
    selectGroup: composer.fields.selectGroup,
    onsubmit: (selectGroup) => {
      composer.fields.selectGroup = selectGroup;
    },
  });
}

export default () => {
  const componentPath = 'flarum/forum/components/DiscussionComposer';

  extend(componentPath, 'oninit', function () {
    this.addReadPermission = (event) => showReadPermissionModal(this.composer, event);
  });

  extend(componentPath, 'headerItems', function (items) {
    const selectedGroup = this.composer.fields.selectGroup;
    const labelKey = selectedGroup ? 'edit' : 'add';

    items.add(
      'readPermission',
      <button
        type="button"
        className="Button Button--link ComposerBody-readPermission"
        onclick={(event) => showReadPermissionModal(this.composer, event)}
      >
        <span className={classList('readPermissionLabel', !selectedGroup && 'none')}>
          {app.translator.trans(`nodeloc-read-permission.forum.composer_discussion.${labelKey}_readPermission`)}
        </span>
      </button>,
      4
    );
  });

  extend(componentPath, 'data', function (data) {
    const selectedGroup = this.composer.fields.selectGroup;

    if (selectedGroup) {
      data.readPermission = Number(selectedGroup.attribute('readPermission') ?? 0);
    }
  });
};
