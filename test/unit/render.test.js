import { render } from '../../src/index';
import { setupScratch, teardown } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';

describe('render()', () =>
{
	let scratch;
	let resetAppendChild;
	let resetInsertBefore;
	let resetRemoveChild;
	let resetRemove;

	beforeEach(() =>
	{
		scratch = setupScratch();
	});

	afterEach(() =>
	{
		teardown(scratch);
	});

	before(() =>
	{
		resetAppendChild  = logCall(Element.prototype, 'appendChild');
		resetInsertBefore = logCall(Element.prototype, 'insertBefore');
		resetRemoveChild  = logCall(Element.prototype, 'removeChild');
		resetRemove       = logCall(Element.prototype, 'remove');
	});

	after(() =>
	{
		resetAppendChild();
		resetInsertBefore();
		resetRemoveChild();
		resetRemove();
	});

	it('should allow node type change with content', () =>
	{
		render(`<span>Bad</span>`, scratch);
		render(`<div>Good</div>`, scratch);
		expect(scratch.innerHTML).to.eql(`<div>Good</div>`);
	});

});