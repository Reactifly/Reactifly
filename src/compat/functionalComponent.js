import { Component }  from './Component';
import { withHooks, renderQueue } from './hooks';

class FunctionalComponent extends Component
{
    hookCallback = null;

    constructor(render, props)
    {
        super(props);

        this.__internals._fn = render;
    }

    render()
    {
        renderQueue.current = this;

        if (!this.hookCallback)
        {
            this.hookCallback = withHooks(this.__internals._fn);
        }

        return this.hookCallback.call(this, this.props);
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
