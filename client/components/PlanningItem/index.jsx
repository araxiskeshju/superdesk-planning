import React, { PropTypes } from 'react'
import { get, capitalize, some } from 'lodash'
import { ListItem, TimePlanning, DueDate, ItemActionsMenu, StateLabel, Checkbox } from '../index'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import classNames from 'classnames'
import { GENERIC_ITEM_ACTIONS, EVENTS } from '../../constants/index'
import './style.scss'
import { getCoverageIcon, planningUtils, isItemCancelled, isItemRescheduled } from '../../utils/index'
import { getCurrentAgendaId } from '../../selectors'


const PlanningItem = ({
        item,
        agendas,
        event,
        onClick,
        active,
        onSpike,
        onUnspike,
        privileges,
        onDoubleClick,
        itemLocked,
        onAgendaClick,
        onDuplicate,
        onRescheduleEvent,
        session,
        onCancelEvent,
        onUpdateEventTime,
        onPostponeEvent,
        onConvertToRecurringEvent,
        onSelectItem,
        isSelected,
        currentAgendaId,
    }) => {
    const location = get(event, 'location[0].name')
    const coverages = get(item, 'coverages', [])
    const dueDates = get(item, '_coverages', []).map((c) => (get(c, 'scheduled'))).filter(d => (d))
    const coveragesTypes = planningUtils.mapCoverageByDate(coverages)
    const isScheduled = some(coverages, (c) => (get(c, 'planning.scheduled')))
    const notForPublication = item ? get(item, 'flags.marked_for_not_publication', false) : false

    const isCancelled = isItemCancelled(item)
    const isRescheduled = isItemRescheduled(item)

    const onEditOrPreview = planningUtils.canEditPlanning(item, session, privileges) ?
        onDoubleClick : onClick

    const actions = [
        {
            ...GENERIC_ITEM_ACTIONS.SPIKE,
            callback: onSpike.bind(null, item),
        },
        {
            ...GENERIC_ITEM_ACTIONS.UNSPIKE,
            callback: onUnspike.bind(null, item),
        },
        {
            ...GENERIC_ITEM_ACTIONS.DUPLICATE,
            callback: onDuplicate.bind(null, item),
        },
        GENERIC_ITEM_ACTIONS.DIVIDER,
        {
            ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            callback: onCancelEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            callback: onUpdateEventTime.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            callback: onRescheduleEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            callback: onPostponeEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
            callback: onConvertToRecurringEvent.bind(null, event),
        },
    ]

    const itemActions = planningUtils.getPlanningItemActions({
        plan: item,
        event,
        session,
        privileges,
        actions,
    })

    return (
        <ListItem
            item={item}
            className={classNames('PlanningItem',
                { 'PlanningItem--locked': itemLocked },
                { 'PlanningItem--has-been-cancelled': isCancelled || isRescheduled }
            )}
            onClick={onClick}
            onDoubleClick={onEditOrPreview}
            active={active}>
            <div className="sd-list-item__action-menu">
                <Checkbox value={isSelected} onChange={onSelectItem}/>
            </div>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <StateLabel item={item}/>
                    {notForPublication &&
                        <span className="state-label not-for-publication">Not for Publication</span>
                    }
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow PlanningItem__title">
                        {item.slugline &&
                            <span className="ListItem__slugline">{item.slugline}</span>
                        }
                        <span className="ListItem__headline">{item.description_text}</span>
                    </span>
                    {event &&
                        <span className="PlanningItem__event sd-no-wrap">
                            <TimePlanning event={event}/>
                            <i className="icon-calendar-list"/>
                        </span>
                    }
                </div>
                <div className="sd-list-item__row">
                    {coveragesTypes.map((c, i) => (
                        <span key={i} style={{ display:'inherit' }}>
                            <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip id={`${i}${c.g2_content_type}`}>
                                        {capitalize(c.g2_content_type).replace(/_/g, ' ')}
                                    </Tooltip>
                                }>
                                <i className={getCoverageIcon(c.g2_content_type) + ` ${c.iconColor}`}/>
                            </OverlayTrigger>
                            &nbsp;
                        </span>
                    ))}
                    <span className="sd-overflow-ellipsis">
                        {location}
                    </span>&nbsp;
                    {item.agendas &&
                        <span className="sd-list-item--element-grow">
                            {item.agendas.map((agendaId) => {
                                const agenda = agendas.find((agenda) => agenda._id === agendaId)

                                if (!agenda) {
                                    return null
                                }

                                if (agenda._id === currentAgendaId) {
                                    return null
                                }

                                let style = agenda.is_enabled ? 'label--primary label--hollow' : 'label--hollow'

                                return ( <span key={'agenda-label-'+ agenda._id}
                                    className={`label ${style}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAgendaClick(agenda._id)
                                    }}>
                                    {agenda.name}
                                </span>)
                            })}
                        </span>
                    }
                    {dueDates.length > 0 &&
                        <span className="PlanningItem__dueDate sd-no-wrap">
                            <DueDate dates={dueDates}/>
                            {isScheduled && <i className="icon-bell"/>}
                        </span>
                    }
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                {itemActions.length > 0 &&
                    <ItemActionsMenu actions={itemActions}/>
                }
            </div>
        </ListItem>
    )
}

const mapStateToProps = (state) => ({ currentAgendaId: getCurrentAgendaId(state) })

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    agendas: PropTypes.array.isRequired,
    event: PropTypes.object,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSpike: PropTypes.func,
    onUnspike: PropTypes.func,
    privileges: PropTypes.object,
    itemLocked: PropTypes.bool,
    onAgendaClick: PropTypes.func,
    onDuplicate: PropTypes.func,
    session: PropTypes.object,
    onCancelEvent: PropTypes.func,
    onUpdateEventTime: PropTypes.func,
    onRescheduleEvent: PropTypes.func,
    onPostponeEvent: PropTypes.func,
    onConvertToRecurringEvent: PropTypes.func,
    isSelected: PropTypes.bool,
    onSelectItem: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string,
}

export default connect(mapStateToProps)(PlanningItem)
