import { Component } from './Component';
import { RENDER_QUEUE } from '../internal';

/**
 * Wrapper class around functional components.
 * 
 */
function FunctionalComponent(render, props, context)
{
    this.props = props;

    this.context = context;

    this.__internals =
    {
        _fn       : render,
        hookIndex : 0,
        hooks     : [],
        hooksCleanups : [],
        hookDeps      : [],
        layoutEffects : [],
        vnode     : null,
        prevState : {},
        prevProps : {},
        _snapshot : null,
    };

}

FunctionalComponent.prototype = new Component();
FunctionalComponent.prototype.constructor = FunctionalComponent;

/**
 * Runs effects after initial mount.
 * 
 */
FunctionalComponent.prototype.componentDidMount = function()
{
    for (let i = 0; i < this.__internals.hooks.length; ++i)
    {
        const effect = this.__internals.layoutEffects[i];

        if (effect)
        {
            try
            {
                effect();
            }
            catch (e) {}
        }
    }

    this.__internals.layoutEffects = [];
}

/**
 * Runs effects after component update.
 * 
 */
FunctionalComponent.prototype.componentDidUpdate = function()
{
    for (let i = 0; i < this.__internals.hooks.length; ++i)
    {
        const effect = this.__internals.layoutEffects[i];

        if (effect)
        {
            try
            {
                effect();
            }
            catch (e) {}
        }
    }

    this.__internals.layoutEffects = [];
}

/**
 * Runs effects before unmounting.
 * 
 */
FunctionalComponent.prototype.componentWillUnmount = function()
{
    for (let i = 0; i < this.__internals.hooks.length; ++i)
    {
        const cleanup = this.__internals.hooksCleanups[i];

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
FunctionalComponent.prototype.render = function()
{
    const prevContext = RENDER_QUEUE.current;

    try
    {
        RENDER_QUEUE.current = this;

        this.__internals.hookIndex = 0;

        return this.__internals._fn(this.props);
    }
    finally
    {
        RENDER_QUEUE.current = prevContext;
    }
}

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

        return component;
    }

    return factory;
}