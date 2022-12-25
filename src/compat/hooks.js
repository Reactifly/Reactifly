/*
Copyright 2018-2019 a1pack

https://codesandbox.io/s/mnox05qp8?file=/src/index.js:0-7779

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { thunkUpdate, componentNode } from '../vdom/index';
import { is_equal } from '../utils/index';

export const RENDER_QUEUE = {
    current: null
};

let HOOK_CONTEXT;

export function useEffect(effect, deps)
{
    const i = HOOK_CONTEXT.hookIndex++;

    if (!HOOK_CONTEXT.hooks[i])
    {
        HOOK_CONTEXT.hooks[i] = effect;
        HOOK_CONTEXT.hookDeps[i] = deps;
        HOOK_CONTEXT.hooksCleanups[i] = effect();
    }
    else
    {
        if (deps && !is_equal(deps, HOOK_CONTEXT.hookDeps[i]))
        {
            if (HOOK_CONTEXT.hooksCleanups[i])
            {
                HOOK_CONTEXT.hooksCleanups[i]();
            }

            HOOK_CONTEXT.hooksCleanups[i] = effect();
        }
    }
}

export function useRef(initialValue)
{
    return useCallback(refHolderFactory(initialValue), []);
}

function refHolderFactory(reference)
{
    function RefHolder(ref)
    {
        reference = ref;
    }

    Object.defineProperty(RefHolder, "current",
    {
        get: () => reference,
        enumerable: true,
        configurable: true
    });

    return RefHolder;
}

export function useLayoutEffect(effect, deps)
{
    const i = HOOK_CONTEXT.hookIndex++;

    const thisHookContext = HOOK_CONTEXT;

    useEffect(() =>
    {
        thisHookContext.layoutEffects[i] = () =>
        {
            thisHookContext.hooksCleanups[i] = effect();
        };

    }, deps);
}

export function useReducer(reducer, initialState, initialAction)
{
    const i = HOOK_CONTEXT.hookIndex++;

    if (!HOOK_CONTEXT.hooks[i])
    {
        HOOK_CONTEXT.hooks[i] = {
            state: initialAction ? reducer(initialState, initialAction) : initialState
        };
    }

    const thisHookContext = HOOK_CONTEXT;

    return [
        HOOK_CONTEXT.hooks[i].state,
        useCallback(action =>
        {
            thisHookContext.hooks[i].state = reducer(thisHookContext.hooks[i].state, action);

            thisHookContext.setState();
        }, [])
    ];
}

export function useState(initial)
{
    const i = RENDER_QUEUE.current.hookIndex++;

    if (!RENDER_QUEUE.current.hooks[i])
    {
        RENDER_QUEUE.current.hooks[i] = {
            state: transformState(initial)
        };
    }

    const thisHookContext = RENDER_QUEUE.current;

    return [

        RENDER_QUEUE.current.hooks[i].state,

        useCallback(newState =>
        {
            thisHookContext.hooks[i].state = transformState(newState, thisHookContext.hooks[i].state);

            thisHookContext.forceUpdate();

        }, [])
    ];
}

function useCallback(cb, deps)
{
    return useMemo(() => cb, deps);
}

function useMemo(factory, deps)
{
    const i = RENDER_QUEUE.current.hookIndex++;
    if (
        !RENDER_QUEUE.current.hooks[i] ||
        !deps ||
        !is_equal(deps, RENDER_QUEUE.current.hookDeps[i])
    )
    {
        RENDER_QUEUE.current.hooks[i] = factory();
        RENDER_QUEUE.current.hookDeps[i] = deps;
    }

    return RENDER_QUEUE.current.hooks[i];
}

// end public api

function transformState(state, prevState)
{
    if (typeof state === "function")
    {
        return state(prevState);
    }

    return state;
}

// end HOOKS