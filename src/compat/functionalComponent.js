import { Component } from './Component';
import { renderQueue } from './hooks';

class FunctionalComponent extends Component
{
    hookIndex;
    hooks = [];
    hooksCleanups = [];
    hookDeps = [];
    layoutEffects = [];

    constructor(render, props)
    {
        super(props);

        this.__internals._fn = render;
    }

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

    render()
    {
        const prevContext = renderQueue.current;

        try
        {
            renderQueue.current = this;

            this.hookIndex = 0;

            return this.__internals._fn(this.props);
        }
        finally
        {
            renderQueue.current = prevContext;
        }
    }
}

/**
 * Functional component callback
 * 
 * @class
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