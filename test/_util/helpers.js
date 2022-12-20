import { clearLog, getLog } from './logCall';

/**
 * Setup the test environment
 * @param {string} [id]
 * @returns {HTMLDivElement}
 */
export function setupScratch(id)
{
	const scratch = document.createElement('div');
	
	scratch.id = id || 'scratch';
	
	(document.body || document.documentElement).appendChild(scratch);
	
	return scratch;
}


/**
 * Teardown test environment and reset preact's internal state
 * @param {HTMLDivElement} scratch
 */
export function teardown(scratch)
{
	if (scratch)
	{
		scratch.parentNode.removeChild(scratch);
	}

	//testUtilTeardown();

	if (getLog().length > 0)
	{
		clearLog();
	}

	restoreElementAttributes();
}

let attributesSpy, originalAttributesPropDescriptor;

function restoreElementAttributes()
{
	if (originalAttributesPropDescriptor)
	{
		// Workaround bug in Sinon where getter/setter spies don't get auto-restored
		Object.defineProperty(Element.prototype, 'attributes', originalAttributesPropDescriptor);
		attributesSpy = null;
	}
}