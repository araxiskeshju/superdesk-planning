import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as selectors from '../../../selectors';
import {gettext, stringUtils} from '../../../utils';

import {Datetime} from '../../';
import {Location} from '../../Location';
import {Row} from '../../UI/Preview';
import {FileInput, LinkInput} from '../../UI/Form';
import {ContactsPreviewList} from '../../Contacts';

export const EventPreviewComponent = ({item, formProfile, createLink, streetMapUrl, files}) => {
    if (!item) {
        return null;
    }

    const location = get(item, 'location', {});
    const locationName = get(location, 'name');
    const formattedAddress = get(location, 'formatted_address', '');
    const contacts = get(item, 'event_contact_info') || [];

    return (
        <div>
            <Row
                enabled={get(formProfile, 'editor.name.enabled')}
                label={gettext('Event name')}
                value={item.name || '-'}
            />

            <Row
                enabled={get(formProfile, 'editor.definition_short.enabled')}
                label={gettext('Description')}
                value={item.definition_short || '-'}
            />

            <Row flex={true}>
                <Row
                    rowItem={true}
                    label={gettext('From')}
                    value={<Datetime date={get(item, 'dates.start')} darkText={true} />}
                />

                <Row
                    rowItem={true}
                    label={gettext('To')}
                    value={<Datetime date={get(item, 'dates.end')} darkText={true} />}
                />
            </Row>

            <Row
                enabled={get(formProfile, 'editor.location.enabled')}
                label={gettext('Location')}
            >
                <div>
                    <Location
                        name={locationName}
                        address={formattedAddress}
                        mapUrl={streetMapUrl}
                        multiLine={true}
                    />
                </div>
            </Row>

            <Row
                enabled={get(formProfile, 'editor.definition_long.enabled')}
                label={gettext('Long Description')}
                value={stringUtils.convertNewlineToBreak(item.definition_long || '-')}
            />

            <Row
                enabled={get(formProfile, 'editor.event_contact_info.enabled')}
                label={gettext('Contacts')}
            >
                {contacts.length > 0 ? (
                    <ContactsPreviewList
                        contactIds={contacts}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                        tabEnabled={true}
                        readOnly={true}
                    />
                ) : (
                    <div>-</div>
                )}
            </Row>

            <Row
                enabled={get(formProfile, 'editor.ednote.enabled')}
                label={gettext('Ed Note')}
                value={stringUtils.convertNewlineToBreak(item.ednote || '-')}
            />

            <Row
                label={gettext('Occurrence Status')}
                value={get(item.occur_status, 'label') || get(item.occur_status, 'name') || '-'}
            />

            <Row
                enabled={get(formProfile, 'editor.files.enabled')}
                label={gettext('Attachments')}
            >
                {get(item, 'files.length', 0) > 0 ? (
                    <ul>
                        {get(item, 'files').map((file, index) =>
                            (<li key={index}>
                                <FileInput
                                    value={file}
                                    createLink={createLink}
                                    readOnly={true}
                                    files={files}
                                />
                            </li>)
                        )}
                    </ul>
                ) : (
                    <p><span className="sd-text__info">{gettext('No attached files added.')}</span></p>
                )}
            </Row>

            <Row
                enabled={get(formProfile, 'editor.links.enabled')}
                label={gettext('Links')}
            >
                {get(item, 'links.length', 0) &&
                    <ul>
                        {get(item, 'links').map((link, index) =>
                            <li key={index}>
                                <LinkInput
                                    value={link}
                                    readOnly={true}
                                />
                            </li>
                        )}
                    </ul>
                ||
                    <p><span className="sd-text__info">{gettext('No external links added.')}</span></p>
                }
            </Row>
        </div>
    );
};

EventPreviewComponent.propTypes = {
    item: PropTypes.object,
    formProfile: PropTypes.object,
    createLink: PropTypes.func,
    streetMapUrl: PropTypes.string,
    files: PropTypes.object,
};

const mapStateToProps = (state) => ({
    createLink: (f) => (selectors.config.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw'),
    streetMapUrl: selectors.config.getStreetMapUrl(state),
    files: selectors.general.files(state),
});


export const EventPreview = connect(mapStateToProps)(EventPreviewComponent);