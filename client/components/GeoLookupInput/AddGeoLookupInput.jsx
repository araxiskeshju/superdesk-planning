import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import Geolookup from 'react-geolookup';
import DebounceInput from 'react-debounce-input';
import * as Nominatim from 'nominatim-browser';
import {formatAddress, gettext, getItemInArrayById} from '../../utils';
import {get, has} from 'lodash';
import {AddGeoLookupResultsPopUp} from './AddGeoLookupResultsPopUp';
import {CreateNewGeoLookup} from './CreateNewGeoLookup';
import {LocationItem} from './LocationItem';

import './style.scss';

/**
* Modal for adding/editing a location with nominatim search
*/

export class GeoLookupInputComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchResults: null,
            openSuggestsPopUp: false,
            openNewLocationPopup: false,
            unsavedInput: '',
            localSearchResults: null,
            searchLocalAlways: true,
            searching: false,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.resetSearchResults = this.resetSearchResults.bind(this);
        this.onSuggestSelect = this.onSuggestSelect.bind(this);
        this.handleSearchClick = this.handleSearchClick.bind(this);
        this.onSuggestResults = this.onSuggestResults.bind(this);
        this.setLocalLocations = this.setLocalLocations.bind(this);
        this.onLocalSearchOnly = this.onLocalSearchOnly.bind(this);
        this.closeSuggestsPopUp = this.closeSuggestsPopUp.bind(this);
        this.closeNewLocationPopUp = this.closeNewLocationPopUp.bind(this);
        this.saveNewLocation = this.saveNewLocation.bind(this);
        this.onAddNewLocation = this.onAddNewLocation.bind(this);
        this.removeLocation = this.removeLocation.bind(this);

        this.dom = {
            geolookup: null,
            parent: null,
        };
        this.language = get(getItemInArrayById(this.props.users, this.props.currentUserId), 'language', 'en');
    }

    closeSuggestsPopUp() {
        this.setState({
            openSuggestsPopUp: false,
            unsavedInput: '',
            searching: false,
            searchLocalAlways: true,
        });
    }

    closeNewLocationPopUp() {
        this.setState({
            openNewLocationPopup: false,
            unsavedInput: '',
            searching: false,
            searchLocalAlways: true,
        });
    }

    onAddNewLocation() {
        this.setState({
            openSuggestsPopUp: false,
            openNewLocationPopup: true,
            searching: false,
            searchLocalAlways: true,
        });
    }

    saveNewLocation(value) {
        this.props.onChange(this.props.field, value);
        this.setState({
            unsavedInput: '',
            searching: false,
            searchLocalAlways: true,
        });
    }

    removeLocation() {
        this.props.onChange(this.props.field, null);
    }

    setLocalLocations(data = null) {
        let results = null;

        if (get(data, '_items.length', 0) > 0) {
            results = data._items.map((location) => ({
                ...location,
                existingLocation: true,
            }));
        }

        this.setState({localSearchResults: results});
    }

    componentWillReceiveProps(nextProps) {
        if (!get(nextProps.initialValue, 'name')) {
            this.resetSearchResults();
        }
    }

    handleInputChange(event) {
        this.dom.geolookup.onInputChange(event.target.value.replace(/(?:\r\n|\r|\n)/g, ' '));

        // Open pop-up to show external search option
        if (get(event.target, 'value.length') > 1) {
            this.setState({
                openSuggestsPopUp: true,
                openNewLocationPopup: false,
                unsavedInput: event.target.value,
                searching: !this.state.searchLocalAlways,
                searchLocalAlways: !this.state.openSuggestsPopUp || this.state.searchLocalAlways,
            });

            if (this.state.searchLocalAlways) {
                this.searchLocalLocations(event.target.value);
            } else {
                this.searchGeoLookupComponent();
            }
        }
    }

    searchLocalLocations(name = this.state.unsavedInput) {
        this.props.searchLocalLocations(name.trim())
            .then(this.setLocalLocations);
    }

    searchGeoLookupComponent() {
        this.dom.geolookup.hideSuggests();
        this.dom.geolookup.onButtonClick();
    }

    handleSearchClick() {
        if (this.state.unsavedInput) {
            this.searchGeoLookupComponent();

            this.setState({
                searching: !!this.state.unsavedInput,
                searchLocalAlways: false,
            });
        }
    }

    onSuggestResults(suggests) {
        this.setState({
            searchResults: suggests,
            openSuggestsPopUp: true,
            openNewLocationPopup: false,
            searching: false,
        });
    }

    resetSearchResults() {
        this.setState({
            unsavedInput: '',
            searchLocalAlways: true,
            openSuggestsPopUp: false,
        });
        if (get(this.state, 'localSearchResults.length', 0) > 0) {
            this.setLocalLocations();
        }
    }

    /**
    * When a suggest got selected
    *    @param  {Object} suggest The suggest
    */
    onSuggestSelect(suggest) {
        this.props.onChange(this.props.field, this.onGeocodeSuggest(suggest));
        this.resetSearchResults();
    }

    onSuggestsLookup(userInput) {
        return Nominatim.geocode({
            q: userInput,
            addressdetails: true,
            extratags: true,
            namedetails: true,
        });
    }

    onGeocodeSuggest(suggest) {
        if (!suggest) return null;

        if (suggest.existingLocation) {
            return {...suggest};
        } else {
            const {shortName} = has(suggest, 'raw') ? formatAddress(suggest.raw) : {};
            const nameField = get(suggest, `raw.namedetails.name:${this.language}`) ?
                `raw.namedetails.name:${this.language}` : 'raw.namedetails.name';

            return {
                nominatim: get(suggest, 'raw', {}),
                location: {
                    lat: get(suggest, 'raw.lat'),
                    lon: get(suggest, 'raw.lon'),
                },
                placeId: get(suggest, 'placeId'),
                name: get(suggest, nameField, shortName),
                boundingbox: get(suggest, 'boundingbox'),
                type: get(suggest, 'type'),
            };
        }
    }

    getSuggestLabel(suggest) {
        return formatAddress(suggest).shortName;
    }

    onLocalSearchOnly() {
        this.setState({searchLocalAlways: true});
        this.searchLocalLocations();
    }

    render() {
        const {
            initialValue,
            streetMapUrl,
            onFocus,
            field,
            disableSearch,
            readOnly,
        } = this.props;

        return (
            <div className="addgeolookup" ref={(node) => this.dom.parent = node}>
                {get(initialValue, 'name') && <LocationItem
                    location={initialValue}
                    streetMapUrl={streetMapUrl}
                    onRemoveLocation={this.removeLocation} />}
                <DebounceInput
                    minLength={2}
                    debounceTimeout={500}
                    value={this.state.unsavedInput}
                    onChange={this.handleInputChange}
                    placeholder={gettext('Search for a location')}
                    className="sd-line-input__input"
                    type="text"
                    name="location"
                    onFocus={onFocus}
                    field={field}
                    disabled={readOnly}
                />

                {this.state.openSuggestsPopUp && (
                    <AddGeoLookupResultsPopUp
                        localSuggests={this.state.localSearchResults}
                        suggests={this.state.searchResults}
                        onCancel={this.closeSuggestsPopUp}
                        onChange={this.onSuggestSelect}
                        handleSearchClick={this.handleSearchClick}
                        showExternalSearch={!readOnly && !disableSearch}
                        showAddLocation={!readOnly}
                        onLocalSearchOnly={this.onLocalSearchOnly}
                        searching={this.state.searching}
                        onAddNewLocation={this.onAddNewLocation}
                        target="sd-line-input__input"
                    />
                )}

                {this.state.openNewLocationPopup && (
                    <CreateNewGeoLookup
                        initialName={this.state.unsavedInput}
                        onSave={this.saveNewLocation}
                        onCancel={this.closeNewLocationPopUp}
                        target="sd-line-input__input"
                        popupContainer={this.props.popupContainer}
                        regions={this.props.regions}
                        countries={this.props.countries}
                        defaultCountry={this.props.preferredCountry}
                    />
                )}

                <Geolookup
                    disableAutoLookup={true}
                    onSuggestSelect={this.onSuggestSelect}
                    onSuggestsLookup={this.onSuggestsLookup}
                    onGeocodeSuggest={this.onGeocodeSuggest}
                    onSuggestResults={this.onSuggestResults}
                    getSuggestLabel={this.getSuggestLabel}
                    readOnly={false}
                    ignoreTab
                    ref={(node) => this.dom.geolookup = node}
                />
            </div>
        );
    }
}

GeoLookupInputComponent.propTypes = {
    field: PropTypes.string,
    initialValue: PropTypes.object,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    searchLocalLocations: PropTypes.func,
    onFocus: PropTypes.func,
    disableSearch: PropTypes.bool,
    streetMapUrl: PropTypes.string,
    users: PropTypes.array,
    currentUserId: PropTypes.string,
    popupContainer: PropTypes.func,
    regions: PropTypes.array,
    countries: PropTypes.array,
    preferredCountry: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
    streetMapUrl: selectors.config.getStreetMapUrl(state),
    currentUserId: selectors.general.currentUserId(state),
    users: selectors.general.users(state),
    regions: selectors.general.regions(state),
    countries: selectors.general.countries(state),
    preferredCountry: selectors.general.preferredCountry(state),
});

const mapDispatchToProps = (dispatch) => ({
    searchLocalLocations: (text) => dispatch(actions.locations.getLocation(text)),
});

export const AddGeoLookupInput = connect(
    mapStateToProps,
    mapDispatchToProps
)(GeoLookupInputComponent);
