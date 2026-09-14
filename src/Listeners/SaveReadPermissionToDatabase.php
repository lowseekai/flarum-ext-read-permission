<?php

namespace Nodeloc\ReadPermission\Listeners;

use Flarum\Group\Event\Saving;
use Illuminate\Support\Arr;

class SaveReadPermissionToDatabase
{
    private $key = 'attributes.readPermission';

    public function handle(Saving $event)
    {
        if (!Arr::has($event->data, $this->key)) {
            return;
        }

        $value = Arr::get($event->data, $this->key);

        // The API resource applies the field to the model. This listener
        // keeps direct event-driven saves compatible with the extension's
        // original payload shape without saving the model a second time.
        $event->group->read_permission = max(0, (int) ($value ?? 0));
    }
}
