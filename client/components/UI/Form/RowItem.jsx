import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const RowItem = ({children, noGrow, className}) => (
    <div className={classNames(
        'form__row-item',
        {'form__row-item--no-grow': noGrow},
        className
    )}>
        {children}
    </div>
);

RowItem.propTypes = {
    children: PropTypes.node,
    noGrow: PropTypes.bool,
    className: PropTypes.string,
};
RowItem.defaultProps = {noGrow: false};
