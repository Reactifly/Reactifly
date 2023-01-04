import { thunkUpdate } from '../vdom/thunk';
import { jsx as parseJSX } from '../jsx/index';
import * as lifecycle from '../vdom/lifecycle';
import _ from '../utils/index';

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which trigger rendering.
 * 
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components'
 * @todo static getDerivedStateFromProps()
 * @todo componentDidCatch() 
 */
export function Component(props, context)
{
    /**
     * Internal use.
     *
     * @var {object}
     */
    this.__internals = {
        _vnode: null,
        _prevState: {},
        _prevProps: {},
        _snapshot: null,
    };

    /**
     * State obj.
     *
     * @var {object}
     */
    this.state = {};

    /**
     * Default props.
     *
     * @var {object}
     */
    this.defaultProps = {};

    /**
     * Props.
     *
     * @var {object}
     */
    this.props = !_.is_object(props) ? {} : props;

    /**
     * Context.
     *
     * @var {object}
     */
    this.context = context;
}

/**
 * Update component state and re-render.
 * 
 * Note that unlike React where the entire Tree is diffed from the Root down whenever a component changes,
 * we only diff down from the actual component change, which why "shouldUpdate", "willUpdate" hooks etc...
 * are called here. Subsequent child component's get patched and their lifecycle's called during/after the patch.
 * 
 * @param {object | string}       key       Key to set using "dot.notation" or state object.
 * @param {mixed}                 value     Value to set or callback if first arg is an object
 * @param {function | undefined}  callback  A function to be called once component state is updated (optional)
 */
Component.prototype.setState = function(key, value, callback)
{
    let changes = {};
    let newState = _.cloneDeep(this.state);

    // setState({ 'foo.bar' : 'foo' })
    if (arguments.length === 1)
    {
        if (_.is_function(key))
        {
            callback = value;
            value = null;
            key = update(newState, this.props);
        }
        else if (!_.is_object(key))
        {
            throw new Error('StateError: State should be an object with [dot.notation] keys. e.g. [setState({"foo.bar" : "baz"})]');
        }

        changes = key;
    }
    else
    {
        changes[key] = value;
    }

    _.foreach(changes, function(k, v)
    {
        _.array_set(k, v, newState);

    }, this);

    if (lifecycle.shouldUpdate(this, this.props, newState))
    {
        lifecycle.willUpdate(this, this.props, newState);

        lifecycle.snapshotBeforeUpdate(this, this.props, this.state);

        this.__internals._prevState = _.cloneDeep(this.state);

        this.state = newState;

        thunkUpdate(this.__internals._vnode);

        lifecycle.didUpdate(this, this.__internals._prevState, this.props);
    }
    else
    {
        this.state = newState;
    }
}

/**
 * Get state using "dot.notation".
 * 
 * @param {string}  key      Key to set using "dot.notation" or state object.
 */
Component.prototype.getState = function(key)
{
    return array_get(key, this.state);
}

/**
 * JSX helper function.
 * 
 * @param   {string}        jsxStr  Key to set using "dot.notation" or state object.
 * @returns {array|object}
 */
Component.prototype.jsx = function(jsxStr)
{
    return parseJSX(jsxStr);
}

/**
 * Update component state and re-render.
 * 
 * @param {function | undefined}  callback  A function to be called once component state is updated (optional)
 */
Component.prototype.forceUpdate = function()
{
    thunkUpdate(this.__internals._vnode);
}