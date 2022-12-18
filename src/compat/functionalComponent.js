import { Component } from './Component';
import { currentComponent } from './hooks';

class FunctionalComponent extends Component
{
    hookIndex;
    hooks = [];
    hookDeps = [];

    constructor(render, props)
    {
        super(props);

        this.__internals._fn = render;
    }

    render()
    {
        const prevContext = currentComponent;

        try
        {
            currentComponent = this;

            this.hookIndex = 0;

            return this.__internals._fn(this.props);

        }
        finally
        {
            currentComponent = prevContext;
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
