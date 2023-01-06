import { Component } from './Component';
import { thunkUpdate } from '../vdom/thunk';
import { extend } from '../utils/index';

let i = 0;

/**
 * Create context.
 * 
 * @param  {mixed}             defaultValue
 * @param  {string|undefined}  contextId     (optional)
 * 
 * The defaultValue argument is only used when a component does not have a matching Provider above it in the tree.
 * This default value can be helpful for testing components in isolation without wrapping them.
 * Note: passing undefined as a Provider value does not cause consuming components to use defaultValue.
 * 
 * 
 * All consumers that are descendants of a Provider will re-render whenever the Provider’s value prop changes.
 * The propagation from Provider to its descendant consumers (including .contextType and useContext) 
 * is not subject to the shouldComponentUpdate method, 
 * so the consumer is updated even when an ancestor component skips an update.
 * 
 * @see https://reactjs.org/docs/context.html#contextprovider
 */
export function createContext(defaultValue, contextId)
{
    contextId = '__cC' + i++;

    const context =
    {
        _id: contextId,
        _defaultValue: defaultValue,
    };

    let subs = [];
    let ctx = {};
 
    const Consumer = function(props, contextValue)
    {
        // return props.children(
        //  context[contextId] ? context[contextId].props.value : defaultValue
        // );
        return props.children(contextValue);
    };

    function Provider(props)
    {
        this.props = props;

        ctx[contextId] = this;
    }

    Provider.prototype.getChildContext = function()
    {
        return ctx[contextId];
    }

    Provider.prototype.shouldComponentUpdate = function(_props)
    {
        if (this.props.value !== _props.value)
        {
            subs.some(thunkUpdate);
        }

        return false;
    }

    Provider.prototype.sub = function(c)
    {        
        subs.push(c);

        let old = c.componentWillUnmount;

        c.componentWillUnmount = () =>
        {
            subs.splice(subs.indexOf(c), 1);

            if (old)
            {
                old.call(c);
            }
        };
    }

    Provider.prototype.render = function ()
    {
        return '<Fragment>{this.props.children}</Fragment>';
    }

    Provider = extend(Component, Provider);

    context.Provider = Provider;
    context.Consumer = Consumer;

    return (context.Provider._contextRef = context.Consumer.contextType = context);
}