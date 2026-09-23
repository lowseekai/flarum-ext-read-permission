<?php

namespace Nodeloc\ReadPermission\Listeners;

use Flarum\Discussion\Event\Saving;
use Illuminate\Support\Arr;

class SaveReadPermissionToDiscussion
{
    public function handle(Saving $event)
    {
        if (Arr::has($event->data, 'attributes.readPermission')) {
            $event->discussion->read_permission = max(
                0,
                (int) (Arr::get($event->data, 'attributes.readPermission') ?? 0)
            );
        }
    }
}
