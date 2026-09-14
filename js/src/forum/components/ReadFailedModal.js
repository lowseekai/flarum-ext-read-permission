import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';

export default class ReadFailedModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.readPermission = Number(this.attrs.readPermission || 0);
  }

  className() {
    return 'ReadModal Modal--small';
  }

  title() {
    return app.translator.trans('nodeloc-read-permission.forum.read-failed');
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="modalText">
          {app.translator.trans('nodeloc-read-permission.forum.read-failed-detail', {
            permission: this.readPermission,
          })}
        </div>
      </div>
    );
  }
}
