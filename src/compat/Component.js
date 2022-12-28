import { thunkUpdate, renderContext } from '../vdom/thunk';
import { jsx as parseJSX } from '../jsx/index';
import _ from '../utils/index';

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which trigger rendering.
 * 
 * static getDerivedStateFromProps()
 * componentDidMount()
 * componentWillUnmount()
 * componentWillReceiveProps(nextProps)
 * getSnapshotBeforeUpdate(prevProps, prevState)
 * shouldComponentUpdate(nextProps, nextState)
 * componentWillUpdate(changedProps, changedState)
 * componentDidUpdate(prevProps, prevState, snapshot)
 * componentDidCatch()
 */
export class Component
{
    /**
     * Context.
     *
     * @var {object}
     */
    context = {};

    /**
     * props.
     *
     * @var {object}
     */
    props = {};

    /**
     * Reference to DOM node.
     *
     * @var {object}
     */
    refs = {};

    /**
     * State obj
     *
     * @var {object}
     */
    state = {};

    /**
     * Default props.
     *
     * @var {object}
     */
    defaultProps = {};

    /**
     * Internal use
     *
     * @var {object}
     */
    __internals = {
        vnode: null,
        prevState: {},
        prevProps: {},
    };

    /**
     * Constructor.
     * 
     * @param {object} props   The initial component props
     * @param {object} context The initial context from parent components'
     */
    constructor(props)
    {
        this.props = !_.is_object(props) ? {} : props;
    }

    /**
     * Update component state and re-render.
     * 
     * @param {object | string}       key       Key to set using "dot.notation" or state object.
     * @param {mixed}                 value     Value to set or callback if first arg is an object
     * @param {function | undefined}  callback  A function to be called once component state is updated (optional)
     */
    setState(key, value, callback)
    {
        if (!_.is_object(this.state))
        {
            this.state = {};
        }

        let stateChanges = {};

        // setState({ 'foo.bar' : 'foo' })
        if (arguments.length === 1)
        {
            if (!_.is_object(key))
            {
                throw new Error('StateError: State should be an object with [dot.notation] keys. e.g. [setState({"foo.bar" : "baz"})]');
            }

            stateChanges = key;
        }
        else
        {
            stateChanges[key] = value;
        }

        this.__internals.prevState = _.cloneDeep(this.state);

        _.foreach(stateChanges, function(key, value)
        {
            _.array_set(key, value, this.state);

        }, this);

        if (!_.is_equal(this.state, this.__internals.prevState))
        {
            thunkUpdate(this.__internals.vnode);
        }
    }

    /**
     * Get state using "dot.notation".
     * 
     * @param {string}  key      Key to set using "dot.notation" or state object.
     */
    getState(key)
    {
        return array_get(key, this.state);
    }

    /**
     * JSX helper function.
     * 
     * @param   {string}        jsxStr  Key to set using "dot.notation" or state object.
     * @returns {array|object}
     */
    jsx(jsxStr)
    {
        const context = renderContext(this);

        return parseJSX(jsxStr, { ...context, this: this });
    }

    /**
     * Update component state and re-render.
     * 
     * @param {function | undefined}  callback  A function to be called once component state is updated (optional)
     */
    forceUpdate()
    {
        thunkUpdate(this.__internals.vnode);
    }
}