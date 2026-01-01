import { i18n } from "../../services/i18n";

export function renderSearchBar(): string {
  return `
    <div class="friend-add-section">
      <h3 class="friend-section-title">${i18n.t('add_friend')}</h3>
      <div class="friend-search-bar">
        <input type="text" id="search-input" placeholder="Search username..." class="friend-search-input">
        <button id="search-btn" class="friend-search-btn">SEARCH</button>
      </div>
      <div id="search-results" class="friend-search-results"></div>
    </div>
  `;
}
