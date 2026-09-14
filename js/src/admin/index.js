import app from 'flarum/admin/app';
import {extend} from 'flarum/common/extend';
import EditGroupModal from 'flarum/admin/components/EditGroupModal';
import Stream from 'flarum/common/utils/Stream';

app.initializers.add('nodeloc/flarum-ext-read-permission', () => {
  extend(EditGroupModal.prototype, 'oninit', function () {
    this.readPermission = Stream(this.group.attribute('readPermission') ?? 0);
  });

  extend(EditGroupModal.prototype, 'fields', function (items) {
    items.add(
      'readPermission',
      <div className="Form-group">
        <label>{app.translator.trans('nodeloc-read-permission.admin.readPermission')}</label>
        <div className="helpText">
          {app.translator.trans('nodeloc-read-permission.admin.readPermissionHelper')}
        </div>
        <input
          className="FormControl"
          type="number"
          min="0"
          step="1"
          bidi={this.readPermission}
        />
      </div>,
      5
    );
  });

  extend(EditGroupModal.prototype, 'submitData', function (data) {
    data.readPermission = Math.max(0, parseInt(this.readPermission(), 10) || 0);
  });
});
