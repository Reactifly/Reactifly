import { Component } from './Component';
import { RENDER_QUEUE } from '../internal';
import { extend } from '../utils/index';

/**
 * Wrapper class around functional components.
 * 
 */
function _FunctionalComponent(render, props, context)
{
    this.props = props;
    this.context = context;
    
    this.__internals._fn = render;
    this.__internals._hookIndex = null;
    this.__internals._hooks = [];
    this.__internals._hooksCleanups = [];
    this.__internals._hookDeps = [];
    this.__internals._layoutEffects = [];
}

/**
 * Runs effects after initial mount.
 * 
 */
_FunctionalComponent.prototype.componentDidMount = function()
{
    for (let i = 0; i < this.__internals._hooks.length; ++i)
    {
        const effect = this.__internals._layoutEffects[i];

        if (effect)
        {
            try
            {
                effect();
            }
            catch (e) {}
        }
    }

    this.__internals._layoutEffects = [];
}

/**
 * Runs effects after component update.
 * 
 */
_FunctionalComponent.prototype.componentDidUpdate = function()
{
    for (let i = 0; i < this.__internals._hooks.length; ++i)
    {
        const effect = this.__internals._layoutEffects[i];

        if (effect)
        {
            try
            {
                effect();
            }
            catch (e) {}
        }
    }

    this.__internals._layoutEffects = [];
}

/**
 * Runs effects before unmounting.
 * 
 */
_FunctionalComponent.prototype.componentWillUnmount = function()
{
    for (let i = 0; i < this.__internals._hooks.length; ++i)
    {
        const cleanup = this.__internals.__hooksCleanups[i];

        if (cleanup)
        {
            try
            {
                cleanup();
            }
            catch (e) {}
        }
    }
}

/**
 * Render function. Wrapper around original function
 * 
 */
_FunctionalComponent.prototype.render = function()
{
    const prevContext = RENDER_QUEUE.current;

    try
    {
        RENDER_QUEUE.current = this;

        this.__internals._hookIndex = 0;

        return this.__internals._fn(this.props);
    }
    finally
    {
        RENDER_QUEUE.current = prevContext;
    }
}

const FunctionalComponent = extend(Component, _FunctionalComponent);

/**
 * Functional component callback
 * 
 * @return {function}
 */
export function functionalComponent(fn)
{
    const factory = function(props)
    {
        let component = new FunctionalComponent(fn, props);

        console.log(component);

        return component;
    }

    return factory;
}