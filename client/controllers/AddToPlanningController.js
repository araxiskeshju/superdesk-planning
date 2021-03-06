import * as actions from '../actions';
import {currentItem, currentItemType} from '../selectors/forms';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ModalsContainer} from '../components';
import {locks} from '../actions';
import {planning} from '../actions';
import {get} from 'lodash';
import {registerNotifications, getErrorMessage, isExistingItem} from '../utils';
import {WORKSPACE, MODALS, MAIN} from '../constants';

export class AddToPlanningController {
    constructor(
        $element,
        $scope,
        $location,
        sdPlanningStore,
        $q,
        notify,
        gettext,
        api,
        lock,
        session,
        userList,
        $timeout,
        superdeskFlags
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.notify = notify;
        this.gettext = gettext;
        this.api = api;
        this.lock = lock;
        this.session = session;
        this.userList = userList;
        this.$timeout = $timeout;
        this.superdeskFlags = superdeskFlags;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onItemUnlock = this.onItemUnlock.bind(this);

        this.store = null;
        this.newsItem = null;
        this.item = get($scope, 'locals.data.item');
        this.rendered = false;

        $scope.$on('$destroy', this.onDestroy);
        $scope.$on('item:unlock', this.onItemUnlock);

        return sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, this.loadWorkspace)
            .then(
                this.render,
                this.$scope.reject
            );
    }

    render() {
        this.store.dispatch(actions.main.closeEditor());
        this.store.dispatch(actions.main.closePreview());

        this.store.dispatch(actions.showModal({
            modalType: MODALS.ADD_TO_PLANNING,
            modalProps: {
                newsItem: this.newsItem,
                fullscreen: true,
                $scope: this.$scope,
            },
        }));

        ReactDOM.render(
            <Provider store={this.store}>
                <ModalsContainer/>
            </Provider>,
            this.$element.get(0)
        );

        this.rendered = true;
        return Promise.resolve();
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;

        return this.loadArchiveItem()
            .then((newsItem) => {
                this.newsItem = newsItem;

                this.store.dispatch(planning.ui.requestPlannings({
                    excludeRescheduledAndCancelled: true,
                }));
                this.store.dispatch(actions.main.closePublishQueuePreviewOnWorkspaceChange());

                registerNotifications(this.$scope, this.store);

                return Promise.all([
                    this.store.dispatch(actions.main.filter(MAIN.FILTERS.PLANNING)),
                    this.store.dispatch(locks.loadAllLocks()),
                    this.store.dispatch(actions.fetchAgendas()),
                ]);
            });
    }

    onDestroy() {
        if (this.store) {
            this.store.dispatch(planning.ui.requestPlannings({
                excludeRescheduledAndCancelled: false,
            }));

            const planningEdited = currentItem(this.store.getState());

            if (isExistingItem(planningEdited)) {
                this.store.dispatch(actions.main.unlockAndCancel(planningEdited))
                    .then(() => {
                        this.store.dispatch(actions.hideModal());
                        this.$timeout(() => {
                            this.store.dispatch(actions.resetStore());
                        }, 1000);
                    });
            } else if (currentItemType(this.store.getState())) {
                // If we were creating a new planning item and editor is open
                this.store.dispatch(actions.main.closeEditor());
            }

            // update the scope item.
            if (this.item && get(this.newsItem, 'assignment_id')) {
                this.item.assignment_id = this.newsItem.assignment_id;
            }

            this.store.dispatch(actions.hideModal());
            this.$timeout(() => {
                this.store.dispatch(actions.resetStore());
            }, 1000);
        }

        // Only unlock the item if it was locked when launching this modal
        if (get(this.newsItem, 'lock_session', null) !== null &&
            get(this.newsItem, 'lock_action', 'edit') === 'add_to_planning') {
            this.lock.unlock(this.newsItem);
        }

        if (this.rendered) {
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }
    }

    onItemUnlock(_e, data) {
        if (this.store &&
            data.item === this.newsItem._id &&
            data.lock_session !== this.session.sessionId
        ) {
            this.store.dispatch(actions.hideModal());
            this.store.dispatch(actions.resetStore());

            if (this.superdeskFlags.flags.authoring || !this.rendered) {
                this.$scope.reject();
                return;
            }

            this.userList.getUser(data.user).then(
                (user) => Promise.resolve(user.display_name),
                () => Promise.resolve('unknown')
            )
                .then((username) => this.store.dispatch(actions.showModal({
                    modalType: MODALS.NOTIFICATION_MODAL,
                    modalProps: {
                        title: this.gettext('Item Unlocked'),
                        body: this.gettext('The item was unlocked by "{{ username }}"', {username}),
                        action: () => {
                            this.newsItem.lock_session = null;
                            this.$scope.reject();
                        },
                    },
                })));
        }
    }

    loadArchiveItem() {
        return this.api.find('archive', this.item._id)
            .then((newsItem) => {
                let failed = false;
                let errMessages = [];

                if (get(newsItem, 'assignment_id')) {
                    errMessages.push('Item already linked to a Planning item');
                    failed = true;
                }

                if (get(newsItem, 'slugline', '') === '') {
                    errMessages.push('[SLUGLINE] is a required field');
                    failed = true;
                }

                if (get(newsItem, 'urgency', null) === null) {
                    errMessages.push('[URGENCY] is a required field');
                    failed = true;
                }

                if (get(newsItem, 'subject.length', 0) === 0) {
                    errMessages.push('[SUBJECT] is a required field');
                    failed = true;
                }

                if (get(newsItem, 'anpa_category.length', 0) === 0) {
                    errMessages.push('[CATEGORY] is a required field');
                    failed = true;
                }

                if (failed) {
                    errMessages.forEach((err) => {
                        this.notify.error(err);
                    });

                    this.$scope.reject();
                    return Promise.reject();
                }

                if (this.lock.isLocked(newsItem)) {
                    this.notify.error(
                        this.gettext('Item already locked.')
                    );
                    this.$scope.reject();
                    return Promise.reject();
                }

                if (!this.lock.isLockedInCurrentSession(newsItem)) {
                    newsItem._editable = true;
                    return this.lock.lock(newsItem, false, 'add_to_planning')
                        .then(
                            (lockedItem) => Promise.resolve(lockedItem),
                            (error) => {
                                this.notify.error(
                                    getErrorMessage(error, 'Failed to lock the item.')
                                );
                                this.$scope.reject(error);
                                return Promise.reject(error);
                            }
                        );
                }

                return Promise.resolve(newsItem);
            }, (error) => {
                this.notify.error(
                    getErrorMessage(error, 'Failed to load the item.')
                );
                this.$scope.reject(error);
                return Promise.reject(error);
            });
    }
}

AddToPlanningController.$inject = [
    '$element',
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
    'notify',
    'gettext',
    'api',
    'lock',
    'session',
    'userList',
    '$timeout',
    'superdeskFlags',
];
