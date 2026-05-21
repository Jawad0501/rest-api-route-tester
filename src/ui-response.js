/**
 * Response panel view switching (JSON body vs AI insight).
 */

const $ = window.jQuery;

export function setResponseView(tabContent, view) {
  const v = view === 'ai' ? 'ai' : 'json';
  tabContent.find('.wprrt-response-tab').removeClass('is-active').attr('aria-selected', 'false');
  tabContent.find(`.wprrt-response-tab[data-view="${v}"]`).addClass('is-active').attr('aria-selected', 'true');
  tabContent.find('.wprrt-response-view').removeClass('is-active').attr('hidden', true);
  tabContent.find(`.wprrt-response-view[data-view="${v}"]`).addClass('is-active').removeAttr('hidden');
}

export function focusResponsePanel(tabContent) {
  const block = tabContent.find('.wprrt-response-block')[0];
  if (block) {
    block.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

export function bindResponseViewTabs() {
  $(document).on('click', '.wprrt-response-tab', function () {
    const tabContent = $(this).closest('.wprrt-tab-content');
    setResponseView(tabContent, $(this).data('view'));
  });
}
