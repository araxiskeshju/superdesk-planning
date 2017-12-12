# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from .events import EventsResource, EventsService
from .events_spike import EventsSpikeResource, EventsSpikeService, EventsUnspikeResource, EventsUnspikeService
from .events_files import EventsFilesResource, EventsFilesService
from .events_history import EventsHistoryResource, EventsHistoryService
from .events_lock import EventsLockResource, EventsLockService, EventsUnlockResource, EventsUnlockService
from .events_duplicate import EventsDuplicateResource, EventsDuplicateService
from .events_publish import EventsPublishService, EventsPublishResource
from .events_cancel import EventsCancelService, EventsCancelResource
from .events_reschedule import EventsRescheduleService, EventsRescheduleResource
from .events_postpone import EventsPostponeService, EventsPostponeResource


def init_app(app):
    """Initialize events

    :param app: superdesk app
    """
    events_lock_service = EventsLockService('events_lock', backend=superdesk.get_backend())
    EventsLockResource('events_lock', app=app, service=events_lock_service)

    events_unlock_service = EventsUnlockService('events_unlock', backend=superdesk.get_backend())
    EventsUnlockResource('events_unlock', app=app, service=events_unlock_service)

    events_search_service = EventsService('events', backend=superdesk.get_backend())
    EventsResource('events', app=app, service=events_search_service)

    events_spike_service = EventsSpikeService('events_spike', backend=superdesk.get_backend())
    EventsSpikeResource('events_spike', app=app, service=events_spike_service)

    events_unspike_service = EventsUnspikeService('events_unspike', backend=superdesk.get_backend())
    EventsUnspikeResource('events_unspike', app=app, service=events_unspike_service)

    events_publish_service = EventsPublishService('events_publish', backend=superdesk.get_backend())
    EventsPublishResource('events_publish', app=app, service=events_publish_service)

    files_service = EventsFilesService('events_files', backend=superdesk.get_backend())
    EventsFilesResource('events_files', app=app, service=files_service)

    events_history_service = EventsHistoryService('events_history', backend=superdesk.get_backend())
    EventsHistoryResource('events_history', app=app, service=events_history_service)

    events_cancel_service = EventsCancelService(EventsCancelResource.endpoint_name,
                                                backend=superdesk.get_backend())
    EventsCancelResource(EventsCancelResource.endpoint_name,
                         app=app,
                         service=events_cancel_service)

    events_reschedule_service = EventsRescheduleService(
        EventsRescheduleResource.endpoint_name,
        backend=superdesk.get_backend()
    )
    EventsRescheduleResource(
        EventsRescheduleResource.endpoint_name,
        app=app,
        service=events_reschedule_service
    )

    events_postpone_service = EventsPostponeService(EventsPostponeResource.endpoint_name,
                                                    backend=superdesk.get_backend())
    EventsPostponeResource(EventsPostponeResource.endpoint_name,
                           app=app,
                           service=events_postpone_service)

    events_duplicate_service = EventsDuplicateService('events_duplicate', backend=superdesk.get_backend())
    EventsDuplicateResource('events_duplicate', app=app, service=events_duplicate_service)

    app.on_updated_events += events_history_service.on_item_updated
    app.on_inserted_events += events_history_service.on_item_created
    app.on_deleted_item_events -= events_history_service.on_item_deleted
    app.on_deleted_item_events += events_history_service.on_item_deleted
    app.on_updated_events_spike += events_history_service.on_spike
    app.on_updated_events_unspike += events_history_service.on_unspike
    app.on_updated_events_cancel += events_history_service.on_cancel
    app.on_updated_events_reschedule += events_history_service.on_reschedule
    app.on_updated_events_postpone += events_history_service.on_postpone
    app.on_locked_events += events_search_service.on_locked_event

    # Privileges
    superdesk.privilege(
        name='planning_event_management',
        label='Planning - Event Management',
        description='Ability to create and modify Events'
    )

    superdesk.privilege(
        name='planning_event_spike',
        label='Planning - Spike Event Items',
        description='Ability to spike an Event'
    )

    superdesk.privilege(
        name='planning_event_unspike',
        label='Planning - Unspike Event Items',
        description='Ability to unspike an Event'
    )

    superdesk.privilege(
        name='planning_event_publish',
        label='Planning - Publish Event Items',
        description='Ability to publish an Event'
    )

    superdesk.privilege(
        name='planning_unlock',
        label='Planning - Unlock events and planning items',
        description='Ability to unlock Events and Planning Items'
    )

    superdesk.intrinsic_privilege(EventsUnlockResource.endpoint_name, method=['POST'])
