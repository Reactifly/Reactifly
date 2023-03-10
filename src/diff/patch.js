import { action } from './commit';
import * as vDom from '../vdom/utils';
import * as thunk from '../vdom/thunk';
import * as lifecycle from '../vdom/lifecycle';
import { GLOBAL_CONTEXT } from '../internal';
import _ from '../utils/index';

/**
 * Patch previous/next render Vnodes (Recursive).
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
export function patch(left, right, actions)
{    
    actions = _.is_undefined(actions) ? [] : actions;

    // Same nothing to do
    if (left === right)
    {
        // nothing to do
    }
    else if (left.type !== right.type)
    {
        replaceNode(left, right, actions);
    }
    else if (vDom.isNative(right))
    {
        patchNative(left, right, actions);
    }
    else if (vDom.isText(right))
    {
        patchText(left, right, actions);
    }
    else if (vDom.isThunk(right))
    {
        patchThunk(left, right, actions);
    }
    else if (vDom.isFragment(right))
    {
        patchFragment(left, right, actions);
    }
    else if (vDom.isEmpty(right))
    {
        replaceNode(left, right, actions);
    }
}

/**
 * Patch text Vnode.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchText(left, right, actions)
{
    if (right.nodeValue !== left.nodeValue)
    {
        let text = right.nodeValue.slice();

        actions.push(action('replaceText', [left, text]));
    }
}

/**
 * Replace Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function replaceNode(left, right, actions)
{
    lifecycle.willUnMount(left);

    if (vDom.isThunk(right))
    {
        let component = thunk.thunkInstantiate(right);

        vDom.pointVnodeThunk(right, component);

        actions.push(action('replaceNode', [left, right]));

        actions.push(action('didMount', [component, true]));
    }
    else
    {
        actions.push(action('replaceNode', [left, right]));
    }
}

/**
 * Patch native Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchNative(left, right, actions)
{    
    if (left.tagName !== right.tagName)
    {
        lifecycle.willUnMount(left);

        actions.push(action('replaceNode', [left, right]));
    }
    else
    {
        let oldHtml = left.attributes.dangerouslySetInnerHTML;
        let newHtml = right.attributes.dangerouslySetInnerHTML;

        // No innerHTML
        if (!oldHtml && !newHtml)
        {
            diffAttributes(left, right, actions);

            patchChildren(left, right, actions);
        }
        // Both have innerHTML
        else if (oldHtml && newHtml)
        {
            if (oldHtml.__html !== newHtml.__html)
            {
                actions.push(action('setInnerHtml', [left, newHtml.__html]));
            }

            diffAttributes(left, right, actions);
        }
        // Removing innerHTML
        else if (oldHtml && !newHtml)
        {
            diffAttributes(left, right, actions);

            patchChildren(left, right, actions);
        }
        // Setting new innerHTML
        else if (!oldHtml && newHtml)
        {
            actions.push(action('setInnerHtml', [left, newHtml.__html]));

            diffAttributes(left, right, actions);
        }
    }
}

/**
 * Patch thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchThunk(left, right, actions)
{
    // Root
    if (vDom.isRoot(left) && vDom.isRoot(right))
    {
        diffRoot(left, right, actions);
    }
    // Different components
    else if (!vDom.isSameThunk(left, right))
    {
        lifecycle.willUnMount(left);

        let component = thunk.thunkInstantiate(right);

        vDom.pointVnodeThunk(right, component);

        actions.push(action('replaceNode', [left, right]));

        actions.push(action('didMount', [component, true]));
        
    }
    // Same component
    else
    {
        let component = vDom.nodeComponent(left);

        if (lifecycle.shouldUpdate(component, right.props, component.state))
        {
            patchThunkProps(left, right.props);

            diffThunk(left, right, actions);

            actions.push(action('didUpdate', [component, component.__internals._prevProps, component.state]));
        }
    }
}

/**
 * Patch thunk props.
 * 
 * @param {object}  vnode
 * @param {object}  newProps
 */
function patchThunkProps(vnode, newProps)
{
    let component = vDom.nodeComponent(vnode);

    lifecycle.willReceiveProps(component, newProps);

    lifecycle.snapshotBeforeUpdate(component, vnode.props, component.state);

    lifecycle.willUpdate(component, newProps, component.state);

    component.__internals._prevProps = _.cloneDeep(vnode.props);

    component.props = newProps;

    vnode.props = newProps;
}

/**
 * Diff thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffRoot(left, right, actions)
{
    let component = thunk.thunkInstantiate(right);

    vDom.pointVnodeThunk(right, component);

    patchChildren(left, right, actions);
}


/**
 * Diff thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffThunk(left, right, actions)
{
    const thisContext = GLOBAL_CONTEXT.current;

    let component = vDom.nodeComponent(left);
    let rightchild = thunk.thunkRender(component);
    right.children = [rightchild];

    if (component.getChildContext)
    {
        GLOBAL_CONTEXT.current = component.getChildContext();
    }

    patchChildren(left, right, actions);

    GLOBAL_CONTEXT.current = thisContext;
}

/**
 * Patch fragment Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchFragment(left, right, actions)
{
    patchChildren(left, right, actions);
}

/**
 * Patch Vnode children.
 * 
 * This is a less expensive pre-patch before diffing is needed if possible
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchChildren(left, right, actions)
{        
    let lChildren = left.children;
    let rChildren = right.children;

    // Quick check
    if (vDom.noChildren(left) && vDom.noChildren(right))
    {
        actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));
    }
    // We're only adding new children
    else if (vDom.noChildren(left))
    {
        // Clear the children now
        //left.children = [];

        // Only need to add a single child
        if (vDom.singleChild(right))
        {
            actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));

            //actions.push(action('appendChild', [left, rChildren[0]]));
        }

        // We're adding multiple new children
        else if (!vDom.noChildren(right))
        {
            actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));

            _.foreach(rChildren, function(i, child)
            {
                if (i > 0) actions.push(action('appendChild', [left, child]));
            });
        }
    }
    // There's only a single child in previous tree
    else if (vDom.singleChild(left))
    {
        // Both have a single node
        if (vDom.singleChild(right))
        {
            // left and right could be the same / different type, so we need to patch them
            patch(lChildren[0], rChildren[0], actions);
        }
        // We're only removing the left node, nothing to insert
        else if (vDom.noChildren(right))
        {
            lifecycle.willUnMount(lChildren[0]);

            // Replace empty with empty
            actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));
        }
        // There's a single child getting replaced with multiple
        else
        {
            // Keys and positions haven't changed
            if (lChildren[0].key === rChildren[0].key)
            {
                patch(lChildren[0], rChildren[0], actions);

                _.foreach(rChildren, function(i, child)
                {
                    if (i > 0)
                    {
                        actions.push(action('appendChild', [left, child]));
                    }
                });
            }
            else
            {
                patchSingleToMultiChildren(left, right, lChildren[0], rChildren, actions);
            }
        }
    }
    // Previous tree has multiple children
    else
    {
        // Removing all children except one
        if (vDom.singleChild(right))
        {
            let matchedKey = false;

            _.foreach(lChildren, function(i, lChild)
            {
                if (lChild.key === rChildren[0].key)
                {
                    patch(lChild, rChildren[0], actions);

                    matchedKey = true;
                }
                else
                {
                    lifecycle.willUnMount(lChild);

                    actions.push(action('removeChild', [left, lChild]));
                }
            });

            if (!matchedKey)
            {
                actions.push(action('appendChild', [left, rChildren[0]]));
            }
        }
        // We're only removing children
        else if (vDom.noChildren(right))
        {
            // When there are no child nodes in the new children
            _.foreach(left.children, function(i, child)
            {
                lifecycle.willUnMount(child);

                actions.push(action('removeChild', [left, child]));
            });

            // Append empty child
            actions.push(action('appendChild', [left, right.children[0]]));

        }
        // Both have multiple children, patch the difference
        else
        {
            diffChildren(left, right, actions);
        }
    }
}

/**
 * Patch single to multiple children
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {object}  lChild
 * @param {array}   rChildren
 * @param {array}   actions
 */
function patchSingleToMultiChildren(left, right, lChild, rChildren, actions)
{
    // We need to compare keys and check if one
    let lKey = lChild.key;
    let rChild = null;
    let newIndex = 0;

    // Append remaining children
    _.foreach(rChildren, function(i, child)
    {
        // If a key was matched but the child has moved index we need to move
        // and patch after appending all the new children
        if (child.key === lKey)
        {
            // If the child has moved index, we should move and patch it after
            if (i !== 0)
            {
                rChild = child;
                newIndex = i;
            }
            // Otherwise we just patch it now
            else
            {
                patch(lChild, child, actions);
            }
        }
        else
        {
            actions.push(action('appendChild', [left, child]));
        }
    });

    // The old key doesn't exist
    if (rChild)
    {
        actions.push(action('moveToIndex', [left, lChild, newIndex]));

        patch(lChild, rChild, actions);
    }
}

/**
 * Diff children.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffChildren(left, right, actions)
{
    let lGroup = groupByKey(left.children);
    let rGroup = groupByKey(right.children);
    let actionsStartIndex = actions.length > 0 ? actions.length : 0;
    let subActions = [];
    let inserted = 0;

    // Note we should still patch indivdual children etc.. but check keys

    // Special case if keys are exactly the same we can just patch each child
    let lKeys = Object.keys(lGroup);
    let rKeys = Object.keys(rGroup);

    if (_.is_equal(lKeys, rKeys))
    {
        _.foreach(right.children, function(i, rChild)
        {
            patch(left.children[i], rChild, actions);
        });

        return;
    }

    // Loop right children
    // Note insertAtIndex & removeChild to be executed before moveToIndex
    // otherwise moveToIndex will be incorrect

    // Also when moving multiple indexes, if a move has moves that run after it
    // that are being moved from before it to after it, that index will be incorrect
    // as the prior nodes have not been moved yet
    _.foreach(rGroup, function(_key, entry)
    {
        let rIndex = entry.index;
        let rChild = entry.child;
        let lEntry = lGroup[_key];

        // New node either by key or > index
        if (_.is_undefined(lEntry))
        {
            let _insert = rIndex >= lKeys.length ? action('appendChild', [left, rChild]) : action('insertAtIndex', [left, rChild, rIndex]);

            if (!inserted)
            {
                subActions.unshift(_insert);
            }
            else
            {
                subActions.splice(inserted, 0, _insert);
            }

            inserted++;
        }
        // Same key, check index
        else
        {
            delete lGroup[_key];

            let lChild = lEntry.child;

            // Different indexes
            // move then patch
            if (lEntry.index !== rIndex)
            {
                subActions.push(action('moveToIndex', [left, lChild, rIndex]));

                patch(lChild, rChild, actions);
            }
            // Unmoved / patch
            else
            {
                patch(lChild, rChild, actions);
            }
        }
    });

    // We need to remove children last so moving to index works
    if (!_.is_empty(lGroup))
    {
        _.foreach(lGroup, function(i, entry)
        {
            lifecycle.willUnMount(entry.child);

            subActions.unshift(action('removeChild', [left, entry.child]));
        });
    }

    if (!_.is_empty(subActions))
    {
        _.foreach(subActions, function(i, action)
        {
            actions.splice(actionsStartIndex, 0, action);

            actionsStartIndex++;
        });
    }
}

// We need to key thunks by name / count here
// so they get patched rather than remounted

function groupByKey(children)
{
    let ret = {};
    let thunks = {};

    _.foreach(children, function(i, child)
    {
        let { key } = child;

        // This stop thunks from reinstating when they don't need to
        if (vDom.isThunk(child) && !key)
        {
            let name = vDom.thunkName(child);

            if (!_.is_undefined(thunks[name]))
            {
                key = name + '_' + (thunks[name] + 1);

                thunks[name]++;
            }
            else
            {
                key = name;

                thunks[name] = 1;
            }
        }
        else if (!key)
        {
            if (vDom.isNative(child))
            {         
                key = `|${child.tagName}`;

                let x = 0;

                while (ret[key])
                {
                    x++;

                    key = `${key}${x}`;
                }
            }
            else
            {
                key = `|${i}`;
            }
        }

        ret[key] = {
            index: i,
            child,
        };
    });

    return ret;
}

/**
 * Diff native attributes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffAttributes(left, right, actions)
{
    let pAttrs = left.attributes;
    let nAttrs = right.attributes;

    // Both are empty
    if (_.is_empty(pAttrs) && _.is_empty(nAttrs))
    {
        return;
    }

    _.foreach(nAttrs, function(prop, value)
    {
        if (!_.is_equal(value, pAttrs[prop]))
        {
            actions.push(action('setAttribute', [left, prop, value, pAttrs[prop]]));
        }
    });

    let nkeys = Object.keys(right.attributes);

    _.foreach(pAttrs, function(prop, value)
    {
        if (!nkeys.includes(prop))
        {
            actions.push(action('removeAttribute', [left, prop, pAttrs[prop]]));
        }
    });

    // Patch in new attributes
    vDom.nodeAttributes(left, nAttrs);
}