import { Component } from './Component';
import { extend, is_function, foreach, is_array } from '../utils/index';

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
export function createContext(defaultValue)
{
    let contextId = '__cC' + i++;

    const context = {
        _id: contextId,
        _defaultValue: defaultValue,
    };

    let subs = [];

    const Consumer = function(props)
    {
        if (!props.children || !is_array(props.children) || props.children.length !== 1)
        {
            throw new Error('Context.Consumers must return a function as their child.');
        }

        let callback = props.children[0];

        if (!is_function(callback))
        {
            throw new Error('Context.Consumers must return a function as their child.');
        }

        return callback(context[contextId] ? context[contextId].props.value : defaultValue);
    };

    function Provider(props)
    {
        this.props = props;

        context[contextId] = this;
    }

    Provider.prototype.getChildContext = function()
    {
        return context[contextId];
    }

    Provider.prototype.shouldComponentUpdate = function(_props)
    {
        if (this.props.value !== _props.value)
        {
            foreach(subs, function(i, child)
            {
                child.context = _props.value;
            });

            return true;
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

    Provider.prototype.render = function()
    {
        context[contextId] = this;

        return '<Fragment>{this.props.children}</Fragment>';
    }

    Provider = extend(Component, Provider);

    context.Provider = Provider;
    context.Consumer = Consumer;

    return (context.Provider._contextRef = context.Consumer.contextType = context);
}