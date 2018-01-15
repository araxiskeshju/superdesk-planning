import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import '../style.scss';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {RelatedEvents} from '../../index';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {get} from 'lodash';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';

export class SpikeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            relatedEvents: [],
            submitting: false,
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        if (get(this.props, 'initialValues.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
                EventUpdateMethods[0]);

            this.setState({relatedEvents: event._events});
        }

        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
            option);

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
        });
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        this.props.onSubmit({
            ...this.props.initialValues,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const updateMethodLabel = gettext('Would you like to spike all recurring events or just this one?');
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        return (
            <div className="ItemActionConfirmation">
                {initialValues.slugline && (
                    <Row
                        label={gettext('Slugline')}
                        value={initialValues.slugline || ''}
                        className="slugline"
                        noPadding={true}
                    />
                )}

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <EventScheduleSummary
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                />

                {isRecurring && (
                    <Row
                        label={gettext('No. of Events')}
                        value={numEvents}
                        noPadding={true}
                    />
                )}

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={updateMethodLabel}
                    showSpace={false}
                    readOnly={this.state.submitting}
                    action="spike" />

                {eventsInUse.length > 0 &&
                    <div className="sd-alert sd-alert--hollow sd-alert--alert">
                        <strong>{gettext('The following Events are in use and will not be spiked:')}</strong>
                        <RelatedEvents
                            events={eventsInUse}
                            dateFormat={dateFormat}
                        />
                    </div>
                }
            </div>
        );
    }
}

SpikeEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};


const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => (dispatch(actions.events.ui.spike(event))),
});

export const SpikeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(SpikeEventComponent);
