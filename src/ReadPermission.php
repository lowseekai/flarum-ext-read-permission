<?php

namespace Nodeloc\ReadPermission;

use Flarum\Discussion\Discussion;
use Flarum\Post\Post;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;

final class ReadPermission
{
    public static function userLevel(User $user): int
    {
        if ($user->isAdmin()) {
            return PHP_INT_MAX;
        }

        $groups = $user->relationLoaded('groups')
            ? $user->groups
            : $user->groups()->get();

        return (int) ($groups->max('read_permission') ?? 0);
    }

    public static function canRead(Discussion $discussion, User $user): bool
    {
        if (($discussion->read_permission ?? 0) <= 0 || $user->isAdmin()) {
            return true;
        }

        return $discussion->user_id === $user->id
            || self::userLevel($user) >= (int) $discussion->read_permission;
    }

    public static function canReadPost(Post $post, User $user): bool
    {
        $discussion = $post->relationLoaded('discussion')
            ? $post->getRelation('discussion')
            : Discussion::query()->find($post->discussion_id);

        return $discussion instanceof Discussion
            && self::canRead($discussion, $user);
    }

    /**
     * Keep restricted post content out of every PostResource query.
     *
     * Discussions remain visible so the forum can render a clear permission
     * boundary, but their post records are unavailable to unauthorized actors.
     */
    public static function scopePosts(User $user, Builder $query): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $level = self::userLevel($user);

        $query->whereIn('posts.discussion_id', function (QueryBuilder $discussionQuery) use ($user, $level): void {
            $discussionQuery
                ->select('discussions.id')
                ->from('discussions')
                ->where(function (QueryBuilder $permissionQuery) use ($user, $level): void {
                    $permissionQuery
                        ->whereNull('discussions.read_permission')
                        ->orWhere('discussions.read_permission', '<=', $level);

                    if ($user->exists) {
                        $permissionQuery->orWhere('discussions.user_id', $user->id);
                    }
                });
        });
    }
}
