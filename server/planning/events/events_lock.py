# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import request
import logging
from superdesk.resource import Resource
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from planning.item_lock import LockService
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from planning.common import update_returned_document


CUSTOM_HATEOAS_EVENTS = {'self': {'title': 'Events', 'href': '/events/{_id}'}}
logger = logging.getLogger(__name__)


class EventsLockResource(Resource):
    endpoint_name = 'events_lock'
    url = 'events/<{0}:item_id>/lock'.format(item_url)
    schema = {'lock_action': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {'POST': 'planning_event_management'}


class EventsLockService(BaseService):

    def create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']

        lock_action = docs[0].get('lock_action', 'edit')
        lock_service = get_component(LockService)

        item_id = request.view_args['item_id']
        item = get_resource_service('events').find_one(req=None, _id=item_id)

        lock_service.validate_relationship_locks(item, 'events')
        updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'events')

        return update_returned_document(docs[0], updated_item, CUSTOM_HATEOAS_EVENTS)


class EventsUnlockResource(Resource):
    endpoint_name = 'events_unlock'
    url = 'events/<{0}:item_id>/unlock'.format(item_url)
    schema = {'lock_user': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class EventsUnlockService(BaseService):

    def create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_service = get_component(LockService)

        # If the event is a recurrent event, unlock all other events in this series
        item_id = request.view_args['item_id']
        resource_service = get_resource_service('events')
        item = resource_service.find_one(req=None, _id=item_id)
        updated_item = lock_service.unlock(item, user_id, session_id, 'events')
        return update_returned_document(docs[0], updated_item, CUSTOM_HATEOAS_EVENTS)
