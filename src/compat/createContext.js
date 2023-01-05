import { Component } from './Component';
import { thunkUpdate } from '../vdom/thunk';
import { extend } from '../utils/index';

let i = 0;

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
        return this.props.children;
    }

    Provider.prototype._isValidCtxProvider = true;

    Provider = extend(Component, Provider);

    context.Provider = Provider;
    context.Consumer = Consumer;

    return (context.Provider._contextRef = context.Consumer.contextType = context);
}