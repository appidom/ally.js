
import platform from '../util/platform';

function before() {
  const data = {
    // remember what had focus to restore after test
    activeElement: document.activeElement,
    // remember scroll positions to restore after test
    windowScrollTop: window.scrollTop,
    windowScrollLeft: window.scrollLeft,
    bodyScrollTop: document.body.scrollTop,
    bodyScrollLeft: document.body.scrollLeft,
  };

  // wrap tests in an element hidden from screen readers to prevent them
  // from announcing focus, which can be quite irritating to the user
  const wrapper = document.createElement('div');
  wrapper.setAttribute('style', 'position:absolute; position:fixed; top:0; left:-2px; width:1px; height:1px; overflow:hidden;');
  wrapper.setAttribute('aria-live', 'off');
  wrapper.setAttribute('aria-busy', 'true');
  wrapper.setAttribute('aria-hidden', 'true');
  document.body.appendChild(wrapper);

  data.wrapper = wrapper;
  return data;
}

// options.element:
//  {string} element name
// options.mutate: (optional)
//  {function} callback(element, wrapper) to manipulate element prior to focus-test.
//             Can return DOMElement to define focus target (default: element)
// options.validate: (optional)
//  {function} callback(element) to manipulate test-result
function test(wrapper, options) {
  // make sure we operate on a clean slate
  data.wrapper.innerHTML = '';
  // create dummy element to test focusability of
  const element = typeof options.element === 'string'
    ? document.createElement(options.element)
    : options.element(wrapper);
  // allow callback to further specify dummy element
  // and optionally define element to focus
  let focus = options.mutate && options.mutate(element, wrapper);
  if (!focus && focus !== false) {
    focus = element;
  }
  // element needs to be part of the DOM to be focusable
  !element.parentNode && wrapper.appendChild(element);
  // test if the element with invalid tabindex can be focused
  focus && focus.focus && focus.focus();
  // validate test's result
  return options.validate
    ? options.validate(element)
    : document.activeElement === focus;
}

function after(data) {
  // restore focus to what it was before test and cleanup
  if (data.activeElement === document.body) {
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    if (platform.is.IE10) {
      // IE10 does not redirect focus to <body> when the activeElement is removed
      document.body.focus()
    }
  } else {
    data.activeElement && data.activeElement.focus && data.activeElement.focus();
  }

  document.body.removeChild(data.wrapper);

  // restore scroll position
  window.scrollTop = data.windowScrollTop;
  window.scrollLeft = data.windowScrollLeft;
  document.body.scrollTop = data.bodyScrollTop;
  document.body.scrollLeft = data.bodyScrollLeft;
}

export default function(tests) {
  const data = before();

  const results = {};
  Object.keys(tests).map(function(key) {
    results[key] = test(data.wrapper, tests[key]);
  });

  after(data);
  return results;
}
