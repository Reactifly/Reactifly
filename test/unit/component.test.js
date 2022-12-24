import Reactifly, { render, jsx, createElement, Component } from '../../src/index';
import { setupScratch, teardown, serializeHtml } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
chai.use(spies);

describe('Components', () =>
{
	/** @type {HTMLDivElement} */
	let scratch;
	let sandbox;

	beforeEach(() =>
	{
		scratch = setupScratch();
		sandbox = chai.spy.sandbox();
	});

	afterEach(() =>
	{
		teardown(scratch);
		sandbox.restore(); 
	});

	describe('Component construction', () =>
	{
		/** @type {object} */
		let instance;
		let PROPS;
		let STATE;

		beforeEach(() =>
		{
			instance = null;
			PROPS = { foo: 'bar', onBaz: () => {} };
			STATE = { text: 'Hello' };
		});

		it('should render components', () =>
		{
			class C1 extends Component
			{
				render()
				{
					return `<div>C1</div>`;
				}
			}
			
			sandbox.on(C1.prototype, ['render']);
			
			render(C1, scratch);

			expect(C1.prototype.render).to.have.been.called();
			
			expect(scratch.innerHTML).to.equal('<div>C1</div>');
		});



		// should render fragment


		// should render nested fragment

		// functional component


	// should render fragment

	// should render nested fragment

	// should render deep nested fragment
	

	});
});
