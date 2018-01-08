import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {defer} from 'lodash';

import {Menu, Label, Divider, Dropdown as DropMenu} from '../Dropdown';

export class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false};
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        // change state only when click event handling is over
        this.inToggle = true;
        defer(() => {
            this.setState({open: !this.state.open}, () => {
                if (this.state.open) {
                    document.addEventListener('click', this.close);
                } else {
                    document.removeEventListener('click', this.close);
                }
            });
            this.inToggle = false;
        });
    }

    close() {
        if (!this.inToggle && this.state.open) {
            this.setState({open: false});
        }
    }

    componentWillUnmount() {
        if (this.state.open) {
            document.removeEventListener('click', this.close);
        }
    }

    render() {
        const isCreate = this.props.icon === 'icon-plus-large';
        const buttonClassName = classNames(
            'dropdown-toggle',
            'dropdown__toggle',
            'navbtn',
            {
                'sd-create-btn': isCreate,
                'navbtn--text-only': this.props.buttonLabel,
            }
        );

        return (
            <DropMenu isOpen={this.state.open} alignRight={this.props.alignRight}>
                <button
                    ref={(btn) => this.btn = btn}
                    className={buttonClassName}
                    onClick={this.toggle}>
                    {this.props.icon && (
                        <i className={this.props.icon} />
                    )}
                    {this.props.buttonLabel}
                    {this.props.buttonLabel && (
                        <span className="dropdown__caret" />
                    )}
                    {isCreate && (
                        <span className="circle" />
                    )}
                </button>
                <Menu isOpen={this.state.open} alignRight={false}>
                    <Label>{this.props.label}</Label>
                    <Divider />
                    {this.props.items.map((item, index) => {
                        if (item.divider) {
                            return <Divider key={index} />;
                        } else {
                            return (
                                <li key={index}>
                                    <button onClick={() => item.action()}>
                                        {item.icon && (
                                            <i className={item.icon} />
                                        )}
                                        {item.label}
                                    </button>
                                </li>
                            );
                        }
                    })}
                </Menu>
            </DropMenu>
        );
    }
}

Dropdown.propTypes = {
    icon: PropTypes.string,
    buttonLabel: PropTypes.string,
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        divider: PropTypes.bool,
        icon: PropTypes.string,
        action: PropTypes.func,
    })).isRequired,
    alignRight: PropTypes.bool,
};

Dropdown.defaultProps = {
    alignRight: false,
};
