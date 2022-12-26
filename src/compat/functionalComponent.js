import { Component } from './Component';
import { RENDER_QUEUE } from './hooks';

/**
 * Wrapper class around functional components.
 * 
 */
class FunctionalComponent extends Component
{
    hookIndex;
    hooks = [];
    hooksCleanups = [];
    hookDeps = [];
    layoutEffects = [];

    /**
     * Constructor.
     * 
     * @param {function}  render  Functional render function
     * @param {object}    props   The initial component props
     * @param {object}    context The initial context from parent components'
     */
    constructor(render, props, context)
    {
        super(props, context);

        this.__internals._fn = render;
    }

    /**
     * Runs effects after initial mount.
     * 
     */
    componentDidMount()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const effect = this.layoutEffects[i];

            if (effect)
            {
                try
                {
                    effect();
                }
                catch (e) {}
            }
        }

        this.layoutEffects = [];
    }

    /**
     * Runs effects after component update.
     * 
     */
    componentDidUpdate()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const effect = this.layoutEffects[i];

            if (effect)
            {
                try
                {
                    effect();
                }
                catch (e) {}
            }
        }

        this.layoutEffects = [];
    }

    /**
     * Runs effects before unmounting.
     * 
     */
    componentWillUnmount()
    {
        for (let i = 0; i < this.hooks.length; ++i)
        {
            const cleanup = this.hooksCleanups[i];

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
    render()
    {
        const prevContext = RENDER_QUEUE.current;

        try
        {
            RENDER_QUEUE.current = this;

            this.hookIndex = 0;

            return this.__internals._fn(this.props);
        }
        finally
        {
            RENDER_QUEUE.current = prevContext;
        }
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