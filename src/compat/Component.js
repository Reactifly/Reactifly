import { thunkUpdate, renderContext } from '../vdom/index';
import { parseJSX } from '../jsx/index';
import _ from '../utils/index';

/**
 * Base component
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
 * @class
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
    __internals = 
    {
        vnode     : null,
        prevState : {},
        prevProps : {},
    };

    /**
     * Constructor
     *
     */
    constructor(props)
    {
        this.props = !_.is_object(props) ? {} : props;
    }

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

    getState(key)
    {
        return array_get(key, this.state);
    }

    jsx(jsx)
    {
        const context = renderContext(this);

        return parseJSX(jsx, {...context, this: this});
    }

    forceUpdate()
    {
        thunkUpdate(this.__internals.vnode);
    }
}