import app from 'flarum/forum/app';

import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import Modal from 'flarum/common/components/Modal';
import Dropdown from 'flarum/common/components/Dropdown';
import Group from 'flarum/common/models/Group';

export default class CreateReadPermissionModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.group =
      this.attrs.selectGroup ||
      app.store.getById('groups', Group.MEMBER_ID) ||
      app.store.all('groups').find((group) => group.id() === Group.MEMBER_ID);
  }

  title() {
    return app.translator.trans(
      `nodeloc-read-permission.forum.modal.${this.attrs.selectGroup ? 'edit' : 'add'}_title`
    );
  }

  className() {
    return 'ReadPermissionDiscussionModal Modal--medium';
  }

  content() {
    return [
      <div className="Modal-body">
        <div className="ReadPermissionDiscussionModal-form">{this.fields()}</div>
      </div>,
    ];
  }

  fields() {
    const icons = {
      [Group.ADMINISTRATOR_ID]: 'fas fa-user-shield',
      [Group.MEMBER_ID]: 'fas fa-user',
      [Group.GUEST_ID]: 'fas fa-user-slash',
    };
    const groups = app.store
      .all('groups')
      .filter((group) => group.id() !== Group.GUEST_ID)
      .sort((a, b) => this.permissionFor(a) - this.permissionFor(b));

    return [
      <div className="Form-group">
        <label className="label">
          {app.translator.trans('nodeloc-read-permission.forum.modal.readPermission_placeholder')}
        </label>
        <Dropdown
          label={this.group ? this.groupLabel(this.group, icons) : app.translator.trans('nodeloc-read-permission.forum.modal.no_groups')}
          buttonClassName="Button Button--danger"
        >
          {groups.map((group) => (
            <Button
              active={this.group?.id() === group.id()}
              icon={group.icon() || icons[group.id()]}
              onclick={() => {
                this.group = group;
                m.redraw();
              }}
            >
              {this.groupLabel(group, icons, false)}
            </Button>
          ))}
        </Dropdown>
      </div>,
      <div className="Form-group">
        <Button
          type="button"
          className="Button Button--primary ReadPermissionModal-SubmitButton"
          loading={this.loading}
          onclick={this.onsubmit.bind(this)}
        >
          {app.translator.trans('nodeloc-read-permission.forum.modal.submit')}
        </Button>
      </div>,
    ];
  }

  permissionFor(group) {
    return Number(group.attribute('readPermission') ?? 0);
  }

  groupLabel(group, icons, includeIcon = true) {
    const label = [group.namePlural(), ' - ', this.permissionFor(group)];

    return includeIcon
      ? [<Icon name={group.icon() || icons[group.id()]} />, ' ', label]
      : label;
  }

  onsubmit(e) {
    e?.preventDefault();
    e?.stopPropagation();

    const data = this.group;

    if (!data) {
      return;
    }
    try {
      const result = this.attrs.onsubmit(data);

      if (!result || typeof result.then !== 'function') {
        this.hide();
        return;
      }

      this.loading = true;
      Promise.resolve(result).then(
        () => this.hide(),
        (err) => {
          console.error(err);
          this.onerror(err);
          this.loaded();
        }
      );
    } catch (err) {
      console.error(err);
      this.onerror(err);
      this.loaded();
    }
  }
}
