import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';

export default class ReadFailedModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.readPermission = Number(this.attrs.readPermission || 0);
    this.group = app.store
      .all('groups')
      .filter((group) => Number(group.attribute('readPermission') ?? group.data?.attributes?.readPermission ?? 0) === this.readPermission)
      .sort((a, b) => a.namePlural().localeCompare(b.namePlural()))[0];
  }

  className() {
    return 'ReadModal Modal--small';
  }

  title() {
    return app.translator.trans('nodeloc-read-permission.forum.read-failed');
  }

  content() {
    const groupName = this.group?.namePlural();

    return (
      <div className="Modal-body">
        <div className="modalText">
          {groupName
            ? app.translator.trans('nodeloc-read-permission.forum.read-failed-detail', {
                group: groupName,
              })
            : app.translator.trans('nodeloc-read-permission.forum.read-failed-detail-unknown')}
        </div>
      </div>
    );
  }
}
