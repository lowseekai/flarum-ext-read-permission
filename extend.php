<?php

/*
 * This file is part of nodeloc/flarum-ext-read-permission.
 *
 * Copyright (c) 2024 Nodeloc.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Nodeloc\ReadPermission;

use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Group\Group;
use Flarum\Discussion\Discussion;
use Flarum\Post\CommentPost;
use Flarum\Post\Post;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\Relation;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),
    new Extend\Locales(__DIR__ . '/locale'),
    (new Extend\Event())
        ->listen(\Flarum\Group\Event\Saving::class, Listeners\SaveReadPermissionToDatabase::class)
        ->listen(\Flarum\Discussion\Event\Saving::class, Listeners\SaveReadPermissionToDiscussion::class),
    (new Extend\ModelVisibility(Post::class))
        ->scope(ReadPermission::scopePosts(...)),
    (new Extend\ApiResource(Resource\DiscussionResource::class))
        ->field(['firstPost', 'lastPost', 'mostRelevantPost'], function ($field) {
            return $field->scope(function (Relation $relation, Context $context): void {
                ReadPermission::scopePosts($context->getActor(), $relation->getQuery());
            });
        })
        ->endpoint(Endpoint\Show::class, function (Endpoint\Show $endpoint): Endpoint\Show {
            return $endpoint
                ->eagerLoadWhere('firstPost', fn (Relation $relation, Context $context) => $relation->getQuery()->whereVisibleTo($context->getActor()))
                ->eagerLoadWhere('lastPost', fn (Relation $relation, Context $context) => $relation->getQuery()->whereVisibleTo($context->getActor()));
        })
        ->endpoint(Endpoint\Index::class, function (Endpoint\Index $endpoint): Endpoint\Index {
            return $endpoint
                ->eagerLoadWhere('mostRelevantPost', fn (Relation $relation, Context $context) => $relation->getQuery()->whereVisibleTo($context->getActor()));
        })
        ->endpoint(Endpoint\Create::class, function (Endpoint\Create $endpoint): Endpoint\Create {
            return $endpoint
                ->eagerLoadWhere('firstPost', fn (Relation $relation, Context $context) => $relation->getQuery()->whereVisibleTo($context->getActor()))
                ->eagerLoadWhere('lastPost', fn (Relation $relation, Context $context) => $relation->getQuery()->whereVisibleTo($context->getActor()));
        }),
    (new Extend\ApiResource(Resource\PostResource::class))
        ->field('contentHtml', function ($field) {
            return $field->visible(function (Post $post, Context $context): bool {
                return $post instanceof CommentPost
                    && ReadPermission::canReadPost($post, $context->getActor());
            });
        }),
    (new Extend\ApiResource(Resource\GroupResource::class))
        ->fields(fn () => [
            Schema\Integer::make('readPermission')
                ->property('read_permission')
                ->get(fn (Group $group): int => (int) ($group->read_permission ?? 0))
                ->writable()
                ->set(function (Group $group, $value): void {
                    $group->read_permission = max(0, (int) ($value ?? 0));
                }),
        ]),
    (new Extend\ApiResource(Resource\DiscussionResource::class))
        ->fields(fn () => [
            Schema\Integer::make('readPermission')
                ->property('read_permission')
                ->get(fn (Discussion $discussion): int => (int) ($discussion->read_permission ?? 0))
                ->writable(function (Discussion $discussion, Context $context): bool {
                    return $context->creating() || $context->getActor()->can('rename', $discussion);
                })
                ->set(function (Discussion $discussion, $value): void {
                    $discussion->read_permission = max(0, (int) ($value ?? 0));
                }),
        ]),
    (new Extend\ApiResource(Resource\PostResource::class))
        ->fields(fn () => [
            Schema\Integer::make('readPermission')
                ->get(fn (Post $post): int => (int) ($post->discussion?->read_permission ?? 0)),
        ]),
    (new Extend\ApiResource(Resource\UserResource::class))
        ->fields(fn () => [
            Schema\Integer::make('readPermission')
                ->visible(fn (User $user, Context $context): bool => $context->getActor()->id === $user->id)
                ->get(function (User $user): int {
                    $groups = $user->relationLoaded('groups')
                        ? $user->groups
                        : $user->groups()->get();

                    return (int) ($groups->max('read_permission') ?? 0);
                }),
        ]),

    (new Extend\Settings())
        ->default('nodeloc-read-permission.group', Group::MEMBER_ID),
];
