import { Component } from './Component';
import { is_equal } from '../utils/index';

/**
 * Component class with a predefined `shouldComponentUpdate` implementation
 */
export function PureComponent(p)
{
    this.props = p;
}

PureComponent.prototype = new Component();
PureComponent.prototype.constructor = PureComponent;

PureComponent.prototype.shouldComponentUpdate = function(props, state)
{
    return !is_equal(this.props, props) || !is_equal(this.state, state);
};

// This isn't needed for Reactifly. Some third-party libraries check if this property is present
// so we're including anway
PureComponent.prototype.isPureReactComponent = true;