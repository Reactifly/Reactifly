import { Component } from './Component';
import { is_equal, extend } from '../utils/index';

/**
 * Component class with a predefined `shouldComponentUpdate` implementation
 */
function PureComponent(p)
{
    this.props = p;
}

PureComponent.prototype.shouldComponentUpdate = function(props, state)
{
    return !is_equal(this.props, props) || !is_equal(this.state, state);
};

// This isn't needed for Reactifly. Some third-party libraries check if this property is present
// so we're including anway
PureComponent.prototype.isPureReactComponent = true;

PureComponent = extend(Component, PureComponent);

export { PureComponent };