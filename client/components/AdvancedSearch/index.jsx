import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {ContentBlock} from '../UI/SidePanel';
import {MAIN, SPIKED_STATE} from '../../constants';
import {
    Row,
    TextInput,
    SelectMetaTermsInput,
    ColouredValueInput,
    SelectInput,
    ToggleInput,
    DateTimeInput,
    RadioButtonInput,
} from '../UI/Form';
import {GeoLookupInput} from '../index';


export class AdvancedSearch extends React.Component {
    constructor(props) {
        super(props);
        this.onDateTimeInputChange = this.onDateTimeInputChange.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        let spikeStateExcludeSpike = false;

        if (get(nextProps, 'diff.advancedSearch.posted') &&
            !get(this.props, 'diff.advancedSearch.posted')) {
            this.props.onChange('spikeState', SPIKED_STATE.NOT_SPIKED);
            spikeStateExcludeSpike = true;
        }

        if (get(nextProps, 'diff.advancedSearch.state.length', 0) > 0 &&
            get(nextProps, 'diff.spikeState') === SPIKED_STATE.SPIKED && !spikeStateExcludeSpike) {
            this.props.onChange('spikeState', SPIKED_STATE.NOT_SPIKED);
        }
    }

    onDateTimeInputChange(field, value) {
        let startDate = get(this.props, 'diff.advancedSearch.dates.start');
        let endDate = get(this.props, 'diff.advancedSearch.dates.end');

        if (field === 'advancedSearch.dates.start.date' && !startDate) {
            value
                .hour(0)
                .minute(0)
                .second(0);
        }

        if (field.indexOf('advancedSearch.dates.start') > -1) {
            startDate = value;
        }

        if (field === 'advancedSearch.dates.end.date' && !endDate) {
            value
                .hour(23)
                .minute(59)
                .second(59);
        }

        if (field.indexOf('advancedSearch.dates.end') > -1) {
            endDate = value;
        }

        const updates = {
            start: startDate,
            end: endDate,
            range: '',
        };

        this.props.onChange('advancedSearch.dates', updates);
    }

    onDateChange(field, value) {
        if (field.indexOf('advancedSearch.dates.start') > -1 ||
        field.indexOf('advancedSearch.dates.end') > -1) {
            this.onDateTimeInputChange(field, value);
            return;
        }

        const updates = {
            start: null,
            end: null,
            range: value,
        };

        this.props.onChange('advancedSearch.dates', updates);
    }

    render() {
        const {
            activeFilter,
            subjects,
            categories,
            ingestProviders,
            contentTypes,
            urgencies,
            dateFormat,
            timeFormat,
            diff,
            onChange,
            workflowStateOptions,
            popupContainer,
        } = this.props;

        // Change spikeState options based on workflow-state selection in the from
        let spikedStateOptions = [
            {
                label: gettext('Exclude spike'),
                value: SPIKED_STATE.NOT_SPIKED,
            },
            {
                label: gettext('Include spike'),
                value: SPIKED_STATE.BOTH,
            },
        ];

        if (get(diff, 'advancedSearch.state.length', 0) === 0) {
            spikedStateOptions.push({
                label: gettext('Spiked only'),
                value: SPIKED_STATE.SPIKED,
            });
        }

        const renderSearchForm = () => {
            // form fields definitions
            const fields = {
                name: {
                    props: {
                        field: 'advancedSearch.name',
                        label: gettext('Name'),
                        value: get(diff, 'advancedSearch.name', ''),
                    },
                    component: TextInput,
                },
                slugline: {
                    props: {
                        field: 'advancedSearch.slugline',
                        label: gettext('Slugline'),
                        value: get(diff, 'advancedSearch.slugline', ''),
                    },
                    component: TextInput,
                },
                location: {
                    props: {
                        field: 'advancedSearch.location',
                        label: gettext('Location'),
                        value: get(diff, 'advancedSearch.location', null),
                        disableSearch: true,
                    },
                    component: GeoLookupInput,
                },
                state: {
                    props: {
                        field: 'advancedSearch.state',
                        label: gettext('Workflow State'),
                        value: get(diff, 'advancedSearch.state', []),
                        options: workflowStateOptions,
                        popupContainer: popupContainer,
                    },
                    component: SelectMetaTermsInput,
                },
                anpa_category: {
                    props: {
                        field: 'advancedSearch.anpa_category',
                        label: gettext('ANPA Category'),
                        value: get(diff, 'advancedSearch.anpa_category', []),
                        options: categories,
                        popupContainer: popupContainer,
                    },
                    component: SelectMetaTermsInput,
                },
                subject: {
                    props: {
                        field: 'advancedSearch.subject',
                        label: gettext('Subject'),
                        value: get(diff, 'advancedSearch.subject', []),
                        options: subjects,
                        popupContainer: popupContainer,
                    },
                    component: SelectMetaTermsInput,
                },
                source: {
                    props: {
                        field: 'advancedSearch.source',
                        label: gettext('Source'),
                        value: get(diff, 'advancedSearch.source', []),
                        options: ingestProviders,
                        valueKey: 'id',
                    },
                    component: SelectMetaTermsInput,
                },
                urgency: {
                    props: {
                        field: 'advancedSearch.urgency',
                        label: gettext('Urgency'),
                        value: get(diff, 'advancedSearch.urgency', null),
                        options: urgencies,
                        iconName: 'urgency-label',
                    },
                    component: ColouredValueInput,
                },
                noCoverage: {
                    props: {
                        field: 'advancedSearch.noCoverage',
                        label: gettext('Without Coverage'),
                        value: get(diff, 'advancedSearch.noCoverage', false),
                        labelLeft: true,
                    },
                    component: ToggleInput,
                },
                featured: {
                    props: {
                        field: 'advancedSearch.featured',
                        label: gettext('Featured'),
                        value: get(diff, 'advancedSearch.featured', null),
                        labelLeft: true,
                    },
                    component: ToggleInput,
                },
                contentType: {
                    props: {
                        field: 'advancedSearch.g2_content_type',
                        label: gettext('Coverage Type'),
                        value: get(diff, 'advancedSearch.g2_content_type', {}),
                        options: contentTypes,
                        labelField: 'name',
                        clearable: true,
                    },
                    component: SelectInput,
                },
                pubstatus: {
                    props: {
                        field: 'advancedSearch.posted',
                        label: gettext('Only Posted'),
                        value: get(diff, 'advancedSearch.posted', false),
                        labelLeft: true,
                    },
                    component: ToggleInput,
                },
                startDateTime: {
                    props: {
                        field: 'advancedSearch.dates.start',
                        label: gettext('From'),
                        value: get(diff, 'advancedSearch.dates.start', null),
                        dateFormat: dateFormat,
                        timeFormat: timeFormat,
                        canClear: true,
                    },
                    component: DateTimeInput,
                    onChange: this.onDateChange,
                },
                endDateTime: {
                    props: {
                        field: 'advancedSearch.dates.end',
                        label: gettext('To'),
                        value: get(diff, 'advancedSearch.dates.end', null),
                        dateFormat: dateFormat,
                        timeFormat: timeFormat,
                        canClear: true,

                    },
                    component: DateTimeInput,
                    onChange: this.onDateChange,
                },
                spikeState: {
                    props: {
                        field: 'spikeState',
                        label: gettext('Spike State'),
                        value: get(diff, 'spikeState', SPIKED_STATE.NOT_SPIKED),
                        readOnly: get(diff, 'advancedSearch.posted', false) === true,
                        options: spikedStateOptions,
                    },
                    component: RadioButtonInput,
                },
                dateFilters: {
                    props: {
                        field: 'advancedSearch.dates.range',
                        label: gettext('Date Filters'),
                        value: get(diff, 'advancedSearch.dates.range', ''),
                        options: [
                            {
                                label: gettext('Today'),
                                value: MAIN.DATE_RANGE.TODAY,
                            },
                            {
                                label: gettext('Tomorrow'),
                                value: MAIN.DATE_RANGE.TOMORROW,
                            },
                            {
                                label: gettext('This Week'),
                                value: MAIN.DATE_RANGE.THIS_WEEK,

                            },
                            {
                                label: gettext('Next Week'),
                                value: MAIN.DATE_RANGE.NEXT_WEEK,
                            },
                        ],
                    },
                    component: RadioButtonInput,
                    onChange: this.onDateChange,
                },
            };


            // form definition
            const searchForm = {
                [MAIN.FILTERS.COMBINED]: [
                    fields.slugline, fields.anpa_category, fields.subject, fields.state,
                    fields.pubstatus, fields.spikeState,
                    fields.startDateTime, fields.endDateTime,
                    fields.dateFilters,
                ],
                [MAIN.FILTERS.EVENTS]: [
                    fields.name, fields.slugline,
                    fields.anpa_category, fields.subject, fields.source, fields.location, fields.state,
                    fields.pubstatus, fields.spikeState,
                    fields.startDateTime, fields.endDateTime,
                    fields.dateFilters,
                ],
                [MAIN.FILTERS.PLANNING]: [
                    fields.slugline, fields.contentType, fields.noCoverage, fields.featured,
                    fields.anpa_category, fields.subject, fields.urgency, fields.state,
                    fields.pubstatus, fields.spikeState,
                    fields.startDateTime, fields.endDateTime, fields.dateFilters,
                ],
            };

            if (activeFilter in searchForm) {
                return searchForm[activeFilter]
                    .map((field, index) => {
                        const props = {
                            ...field.props,
                            onChange: field.onChange || onChange,
                        };
                        const RenderComponent = field.component;

                        return (
                            <Row key={index}>
                                <RenderComponent {...props} />
                            </Row>
                        );
                    }
                    );
            }

            return null;
        };

        return (
            <ContentBlock>
                {renderSearchForm()}
            </ContentBlock>
        );
    }
}

AdvancedSearch.propTypes = {
    activeFilter: PropTypes.string.isRequired,
    currentSearch: PropTypes.object.isRequired,
    diff: PropTypes.object.isRequired,
    categories: PropTypes.array,
    subjects: PropTypes.array,
    urgencies: PropTypes.array,
    contentTypes: PropTypes.array,
    ingestProviders: PropTypes.array,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    workflowStateOptions: PropTypes.array,
    popupContainer: PropTypes.func,
};