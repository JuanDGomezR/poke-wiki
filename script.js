const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/";
const POKEMONS_PER_PAGE = 20;

const pokemonGrid = document.getElementById("pokemonGrid");
const searchInput = document.getElementById("searchInput");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoSpan = document.getElementById("pageInfo");
const pageInput = document.getElementById("pageInput");
const goToPageBtn = document.getElementById("goToPageBtn");
const pokemonDetailModal = document.getElementById("pokemonDetailModal");
const closeButton = pokemonDetailModal.querySelector(".close-button");
const pokemonDetailContent = document.getElementById("pokemonDetailContent");
const typeFiltersContainer = document.getElementById("typeFilters");
const generationFilterSelect = document.getElementById("generationFilter");
const regionFilterSelect = document.getElementById("regionFilter");
const loadingMessage = document.getElementById("loadingMessage");

// Nuevos elementos para otras secciones de datos
const dataCards = document.querySelectorAll(".data-card");
const detailSectionModal = document.getElementById("detailSectionModal");
const detailSectionCloseButton =
  detailSectionModal.querySelector(".close-button");
const detailSectionTitle = document.getElementById("detailSectionTitle");
const detailSectionContent = document.getElementById("detailSectionContent");

let currentPage = 1;
let allPokemons = [];
let detailedPokemonsCache = new Map(); // Caché para detalles completos de Pokémon
let allGenerations = [];
let allRegions = [];
let allItems = []; // Caché para todos los ítems
let allBerries = []; // Caché para todas las bayas
// let allMachines = []; // Eliminado: Caché para todas las máquinas

// La lista de Pokémon actualmente mostrada después de aplicar filtros
let displayedPokemons = [];

let currentFilters = {
  type: "all",
  generation: "all",
  region: "all",
  search: "",
};

// --- Mapeo de Habilidades a Tipos (para iconos y colores, si es aplicable) ---
const abilityTypeMap = {
  blaze: "fire",
  torrent: "water",
  overgrow: "grass",
  static: "electric",
  intimidate: "normal",
  guts: "fighting",
  "poison-point": "poison",
  levitate: "flying",
  "swift-swim": "water",
  "sand-rush": "ground",
  "thunder-punch": "electric",
  "ice-punch": "ice",
  "fire-punch": "fire",
  "iron-fist": "fighting",
  bulletproof: "steel",
  "strong-jaw": "dark",
  "magic-guard": "psychic",
  "poison-touch": "poison",
  "dry-skin": "water",
  "rough-skin": "rock",
  "shed-skin": "normal",
  "sticky-hold": "bug",
  "compound-eyes": "bug",
  adaptability: "normal",
  aerilate: "flying",
  "sheer-force": "normal",
  regenerator: "normal",
  filter: "psychic",
  "solid-rock": "rock",
  soundproof: "normal",
  immunity: "poison",
  "water-absorb": "water",
  "volt-absorb": "electric",
  "flash-fire": "fire",
  "light-metal": "steel",
  "heavy-metal": "steel",
  moxie: "dark",
  "speed-boost": "normal",
  "clear-body": "steel",
  "natural-cure": "grass",
  "flame-body": "fire",
  hustle: "normal",
  insomnia: "psychic",
  "keen-eye": "normal",
  limber: "normal",
  oblivious: "normal",
  rivalry: "normal",
  "run-away": "normal",
  sniper: "dark",
  sturdy: "rock",
  "suction-cups": "water",
  "tangled-feet": "flying",
  unaware: "normal",
  "vital-spirit": "normal",
  "white-smoke": "normal",
  "hyper-cutter": "normal",
  "battle-armor": "steel",
  "shell-armor": "water",
  chlorophyll: "grass",
  "sand-veil": "ground",
  "snow-cloak": "ice",
  "cloud-nine": "flying",
  drizzle: "water",
  drought: "fire",
  "arena-trap": "ground",
  "magnet-pull": "steel",
  "shadow-tag": "ghost",
  download: "electric",
  trace: "normal",
  forecast: "normal",
  "color-change": "normal",
  normalize: "normal",
  "pure-power": "fighting",
  "huge-power": "fighting",
  "thick-fat": "normal",
  "early-bird": "flying",
  "gale-wings": "flying",
  "dark-aura": "dark",
  "fairy-aura": "fairy",
  "aura-break": "fighting",
  prankster: "dark",
  pixilate: "fairy",
  refrigerate: "ice",
  normalize: "normal",
};

// Función auxiliar para obtener el icono de FontAwesome y color basado en el tipo
function getAbilityTypeInfo(abilityName) {
  const normalizedAbilityName = abilityName.toLowerCase().replace(/ /g, "-");
  const type = abilityTypeMap[normalizedAbilityName];
  const typeClass = type ? `type-${type}` : "type-normal";
  const icon = type ? getTypeIcon(type) : "fas fa-star";
  return { typeClass, icon };
}

// Mapeo de tipos a iconos de FontAwesome
const typeIcons = {
  normal: "fas fa-circle",
  fire: "fas fa-fire",
  water: "fas fa-tint",
  electric: "fas fa-bolt",
  grass: "fas fa-leaf",
  ice: "fas fa-snowflake",
  fighting: "fas fa-fist-raised",
  poison: "fas fa-skull-crossbones",
  ground: "fas fa-mountain",
  flying: "fas fa-feather-alt",
  psychic: "fas fa-brain",
  bug: "fas fa-bug",
  rock: "fas fa-gem",
  ghost: "fas fa-ghost",
  dragon: "fas fa-dragon",
  steel: "fas fa-cog",
  dark: "fas fa-moon",
  fairy: "fas fa-sparkles",
  stellar: "fas fa-star",
  unknown: "fas fa-question-circle",
  shadow: "fas fa-cloud",
};

function getTypeIcon(type) {
  return typeIcons[type.toLowerCase()] || "fas fa-question-circle";
}

// --- API Fetching Functions ---

/**
 * Fetches all Pokémon names and URLs.
 */
async function fetchAllPokemonNamesAndUrls() {
  try {
    const response = await fetch(
      `${POKEAPI_BASE_URL}pokemon?limit=100000&offset=0`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allPokemons = data.results
      .map((p) => {
        const urlParts = p.url.split("/");
        const id = parseInt(urlParts[urlParts.length - 2]);
        return {
          name: p.name,
          url: p.url,
          id: id,
          types: [],
          generation: "",
          region: "",
        };
      })
      .sort((a, b) => a.id - b.id);
    console.log(`Loaded ${allPokemons.length} Pokémon names.`);
  } catch (error) {
    console.error("Error fetching all Pokémon names and URLs:", error);
    throw error;
  }
}

/**
 * Fetches complete details for a single Pokémon.
 * Uses a cache to avoid repeated API calls.
 */
async function fetchPokemonDetails(id) {
  if (detailedPokemonsCache.has(id)) {
    return detailedPokemonsCache.get(id);
  }
  const url = `${POKEAPI_BASE_URL}pokemon/${id}/`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Get generation and region from species data
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();
    let generationName = "unknown";
    let regionName = "unknown";

    if (speciesData.generation && speciesData.generation.url) {
      const generationUrlParts = speciesData.generation.url.split("/");
      const generationId = parseInt(
        generationUrlParts[generationUrlParts.length - 2]
      );
      const foundGen = allGenerations.find((gen) => gen.id === generationId);

      if (foundGen) {
        generationName = foundGen.name;
        regionName = foundGen.main_region_name;
      } else {
        const genResponse = await fetch(speciesData.generation.url);
        const genData = await genResponse.json();
        generationName = genData.name;
        if (genData.main_region && genData.main_region.name) {
          regionName = genData.main_region.name;
        }
      }
    }
    data.generation = generationName;
    data.region = regionName;

    detailedPokemonsCache.set(id, data);
    return data;
  } catch (error) {
    console.error(`Error fetching Pokémon details for ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches all available Pokémon types.
 */
async function fetchTypes() {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}type`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results.filter(
      (type) => type.name !== "unknown" && type.name !== "shadow"
    );
  } catch (error) {
    console.error("Error fetching types:", error);
    return [];
  }
}

/**
 * Fetches all Pokémon generations.
 */
async function fetchGenerations() {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}generation`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allGenerations = await Promise.all(
      data.results.map(async (gen) => {
        const genDetailsResponse = await fetch(gen.url);
        const genDetails = await genDetailsResponse.json();
        return {
          id: parseInt(gen.url.split("/").slice(-2, -1)[0]),
          name: gen.name,
          main_region_name: genDetails.main_region
            ? genDetails.main_region.name
            : "unknown",
        };
      })
    );
    allGenerations.sort((a, b) => a.id - b.id);
    return allGenerations;
  } catch (error) {
    console.error("Error fetching generations:", error);
    return [];
  }
}

/**
 * Fetches all Pokémon regions.
 */
async function fetchRegions() {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}region`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allRegions = data.results.map((region) => ({
      id: parseInt(region.url.split("/").slice(-2, -1)[0]),
      name: region.name,
    }));
    allRegions.sort((a, b) => a.id - b.id);
    return allRegions;
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
}

// --- Dynamic Content Functions (Locations, Berries, Items) ---

async function fetchAllItems() {
  if (allItems.length > 0) return allItems;
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}item?limit=2000`);
    const data = await response.json();
    allItems = data.results
      .filter((item) => {
        const id = parseInt(item.url.split("/").slice(-2, -1)[0]);
        return id > 0 && id < 1000;
      })
      .map((item) => ({
        name: item.name,
        id: parseInt(item.url.split("/").slice(-2, -1)[0]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return allItems;
  } catch (error) {
    console.error("Error fetching all items:", error);
    return [];
  }
}

async function fetchAllBerries() {
  if (allBerries.length > 0) return allBerries;
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}berry?limit=1000`);
    const data = await response.json();
    allBerries = data.results
      .map((berry) => ({
        name: berry.name,
        id: parseInt(berry.url.split("/").slice(-2, -1)[0]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return allBerries;
  } catch (error) {
    console.error("Error fetching all berries:", error);
    return [];
  }
}

async function fetchAndDisplayLocations() {
  detailSectionTitle.textContent = "Ubicaciones Pokémon";
  showLoadingOverlay(detailSectionContent);
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}location-area?limit=1000`);
    const data = await response.json();
    const locationsHtml = data.results
      .map(
        (loc) => `
            <li>
                <i class="fas fa-map-marker-alt"></i>
                <span class="item-name">${loc.name.replace(/-/g, " ")}</span>
            </li>
        `
      )
      .join("");
    detailSectionContent.innerHTML = `
            <div class="data-list-container">
                <ul>${locationsHtml}</ul>
            </div>
        `;
  } catch (error) {
    console.error("Error fetching locations:", error);
    detailSectionContent.innerHTML = "<p>Error al cargar ubicaciones.</p>";
  }
  detailSectionModal.style.display = "flex";
}

async function fetchAndDisplayBerries() {
  detailSectionTitle.textContent = "Bayas Pokémon";
  showLoadingOverlay(detailSectionContent);
  const berries = await fetchAllBerries();
  if (berries.length === 0) {
    detailSectionContent.innerHTML = "<p>No se pudieron cargar las bayas.</p>";
    detailSectionModal.style.display = "flex";
    return;
  }
  const berriesHtml = berries
    .map(
      (berry) => `
        <li>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${
              berry.name
            }-berry.png" alt="${
        berry.name
      }" onerror="this.src='https://via.placeholder.com/60x60?text=Berry'">
            <span class="item-name">${berry.name.replace(/-/g, " ")}</span>
        </li>
    `
    )
    .join("");
  detailSectionContent.innerHTML = `
        <div class="data-list-container">
            <ul>${berriesHtml}</ul>
        </div>
    `;
  detailSectionModal.style.display = "flex";
}

async function fetchAndDisplayItems() {
  detailSectionTitle.textContent = "Objetos Pokémon";
  showLoadingOverlay(detailSectionContent);
  const items = await fetchAllItems();
  if (items.length === 0) {
    detailSectionContent.innerHTML =
      "<p>No se pudieron cargar los objetos.</p>";
    detailSectionModal.style.display = "flex";
    return;
  }
  const itemsHtml = items
    .map(
      (item) => `
        <li>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${
              item.name
            }.png" alt="${
        item.name
      }" onerror="this.src='https://via.placeholder.com/60x60?text=Item'">
            <span class="item-name">${item.name.replace(/-/g, " ")}</span>
        </li>
    `
    )
    .join("");
  detailSectionContent.innerHTML = `
        <div class="data-list-container">
            <ul>${itemsHtml}</ul>
        </div>
    `;
  detailSectionModal.style.display = "flex";
}

// Eliminado: fetchAllMachines y fetchAndDisplayMachines

// --- Rendering Functions ---

/**
 * Creates and appends a Pokémon card to the grid.
 */
function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
          pokemon.id
        }.png" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <p>#${String(pokemon.id).padStart(3, "0")}</p>
    `;
  card.addEventListener("click", async () => {
    showLoadingOverlay(pokemonDetailContent);
    pokemonDetailModal.style.display = "flex";
    const fullDetails = await fetchPokemonDetails(pokemon.id);
    if (fullDetails) {
      showPokemonDetail(fullDetails);
    } else {
      pokemonDetailContent.innerHTML =
        "<p>Error al cargar detalles del Pokémon.</p>";
    }
  });
  pokemonGrid.appendChild(card);
}

/**
 * Displays the detailed information of a Pokémon in the modal.
 */
function showPokemonDetail(pokemon) {
  const artworkSrc =
    pokemon.sprites.other["official-artwork"]?.front_default ||
    pokemon.sprites.front_default ||
    "https://via.placeholder.com/150x150?text=No+Image";

  pokemonDetailContent.innerHTML = `
        <img src="${artworkSrc}" alt="${pokemon.name}">
        <h2>${pokemon.name} (#${String(pokemon.id).padStart(3, "0")})</h2>
        <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
        <p><strong>Generación:</strong> <span style="text-transform: capitalize;">${pokemon.generation.replace(
          /-/g,
          " "
        )}</span></p>
        <p><strong>Región Principal:</strong> <span style="text-transform: capitalize;">${pokemon.region.replace(
          /-/g,
          " "
        )}</span></p>
        <p class="types"><strong>Tipos:</strong> ${pokemon.types
          .map(
            (typeInfo) => `
            <span class="type-${typeInfo.type.name}">
                <i class="${getTypeIcon(typeInfo.type.name)}"></i> ${
              typeInfo.type.name
            }
            </span>`
          )
          .join("")}</p>
        <h3>Habilidades:</h3>
        <ul class="abilities-list">
            ${pokemon.abilities
              .map((abilityInfo) => {
                const abilityName = abilityInfo.ability.name.replace(/-/g, " ");
                const { typeClass, icon } = getAbilityTypeInfo(
                  abilityInfo.ability.name
                );
                return `
                    <li class="${typeClass}">
                        <i class="ability-icon ${icon}"></i> <span>${abilityName}</span>
                    </li>`;
              })
              .join("")}
        </ul>
        <h3>Estadísticas Base:</h3>
        <ul>
            ${pokemon.stats
              .map(
                (statInfo) => `
                <li>
                    <strong>${statInfo.stat.name.replace(
                      /-/g,
                      " "
                    )}:</strong> ${statInfo.base_stat}
                    <div class="stat-bar-container">
                        <div class="stat-bar" style="width: ${
                          (statInfo.base_stat / 255) * 100
                        }%;"></div>
                    </div>
                </li>
            `
              )
              .join("")}
        </ul>
    `;
  pokemonDetailModal.style.display = "flex";
}

/**
 * Renders the Pokémon grid with the given list of Pokémon.
 */
function renderPokemonGrid(pokemonsToDisplay) {
  pokemonGrid.innerHTML = "";
  if (pokemonsToDisplay.length === 0) {
    pokemonGrid.innerHTML =
      '<p class="no-results">No se encontraron Pokémon que coincidan con los filtros.</p>';
    return;
  }
  pokemonsToDisplay.forEach((pokemon) => createPokemonCard(pokemon));
}

/**
 * Populates the type filter buttons.
 */
async function populateTypeFilters() {
  const types = await fetchTypes();
  typeFiltersContainer.innerHTML = "";
  const allButton = document.createElement("button");
  allButton.textContent = "Todos";
  allButton.classList.add("active");
  allButton.dataset.type = "all";
  allButton.addEventListener("click", () => {
    currentFilters.type = "all";
    applyFilters();
    updateFilterButtons(typeFiltersContainer, "all");
  });
  typeFiltersContainer.appendChild(allButton);

  types.forEach((type) => {
    const button = document.createElement("button");
    button.textContent = type.name;
    button.dataset.type = type.name;
    button.addEventListener("click", () => {
      currentFilters.type = type.name;
      applyFilters();
      updateFilterButtons(typeFiltersContainer, type.name);
    });
    typeFiltersContainer.appendChild(button);
  });
}

/**
 * Populates the generation filter dropdown.
 */
async function populateGenerationFilter() {
  generationFilterSelect.innerHTML =
    '<option value="all">Todas las Generaciones</option>';
  allGenerations.forEach((gen) => {
    const option = document.createElement("option");
    option.value = gen.name;
    option.textContent = `Generación ${gen.id} (${gen.name.replace(
      /-/g,
      " "
    )})`;
    generationFilterSelect.appendChild(option);
  });
}

/**
 * Populates the region filter dropdown.
 */
async function populateRegionFilter() {
  regionFilterSelect.innerHTML =
    '<option value="all">Todas las Regiones</option>';
  allRegions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.name;
    option.textContent = region.name.replace(/-/g, " ");
    regionFilterSelect.appendChild(option);
  });
}

/**
 * Updates the active state of filter buttons.
 */
function updateFilterButtons(container, activeValue) {
  container.querySelectorAll("button").forEach((button) => {
    if (button.dataset.type === activeValue) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// --- Filtering and Pagination Logic ---

/**
 * Applies current filters to the list of Pokémon and re-renders.
 */
async function applyFilters() {
  showLoadingMessage();
  displayedPokemons = [];

  const filteredByName = allPokemons.filter((pokemon) =>
    pokemon.name.includes(currentFilters.search.toLowerCase())
  );

  const pokemonDetailsPromises = filteredByName.map((pokemon) =>
    fetchPokemonDetails(pokemon.id)
  );
  const detailedFilteredPokemons = (
    await Promise.all(pokemonDetailsPromises)
  ).filter((p) => p !== null);

  displayedPokemons = detailedFilteredPokemons.filter((pokemon) => {
    const matchesType =
      currentFilters.type === "all" ||
      pokemon.types.some(
        (typeInfo) => typeInfo.type.name === currentFilters.type
      );

    const matchesGeneration =
      currentFilters.generation === "all" ||
      pokemon.generation === currentFilters.generation;

    const matchesRegion =
      currentFilters.region === "all" ||
      pokemon.region === currentFilters.region;

    return matchesType && matchesGeneration && matchesRegion;
  });

  currentPage = 1;
  renderCurrentPage();
  updatePaginationControls();
  hideLoadingMessage();
}

/**
 * Renders the Pokémon for the current page.
 */
function renderCurrentPage() {
  const startIndex = (currentPage - 1) * POKEMONS_PER_PAGE;
  const endIndex = startIndex + POKEMONS_PER_PAGE;
  const pokemonsToRender = displayedPokemons.slice(startIndex, endIndex);
  renderPokemonGrid(pokemonsToRender);

  pageInput.value = currentPage;
}

/**
 * Updates the pagination buttons and info.
 */
function updatePaginationControls() {
  const totalPages = Math.ceil(displayedPokemons.length / POKEMONS_PER_PAGE);
  pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages || 1}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage >= totalPages;
  pageInput.max = totalPages || 1;
  pageInput.min = 1;
  goToPageBtn.disabled = totalPages <= 1;
}

// --- Loading UI Helpers ---

function showLoadingMessage() {
  loadingMessage.style.display = "block";
  pokemonGrid.innerHTML = "";
  prevPageBtn.disabled = true;
  nextPageBtn.disabled = true;
  goToPageBtn.disabled = true;
  pageInput.disabled = true;
}

function hideLoadingMessage() {
  loadingMessage.style.display = "none";
  updatePaginationControls();
  pageInput.disabled = false;
}

function showLoadingOverlay(targetElement) {
  targetElement.innerHTML = `
        <div class="loading-overlay">
            <i class="fas fa-spinner fa-spin"></i> Cargando...
        </div>
    `;
}

// --- Event Listeners ---

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(displayedPokemons.length / POKEMONS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

pageInput.addEventListener("change", () => {
  const newPage = parseInt(pageInput.value);
  const totalPages = Math.ceil(displayedPokemons.length / POKEMONS_PER_PAGE);

  if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    pageInput.value = currentPage;
    alert(
      `Por favor, introduce un número de página válido entre 1 y ${
        totalPages || 1
      }.`
    );
  }
});

goToPageBtn.addEventListener("click", () => {
  const newPage = parseInt(pageInput.value);
  const totalPages = Math.ceil(displayedPokemons.length / POKEMONS_PER_PAGE);

  if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderCurrentPage();
    updatePaginationControls();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    alert(
      `Por favor, introduce un número de página válido entre 1 y ${
        totalPages || 1
      }.`
    );
    pageInput.value = currentPage;
  }
});

searchInput.addEventListener("input", () => {
  currentFilters.search = searchInput.value.trim().toLowerCase();
  applyFilters();
});

generationFilterSelect.addEventListener("change", () => {
  currentFilters.generation = generationFilterSelect.value;
  applyFilters();
});

regionFilterSelect.addEventListener("change", () => {
  currentFilters.region = regionFilterSelect.value;
  applyFilters();
});

closeButton.addEventListener("click", () => {
  pokemonDetailModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === pokemonDetailModal) {
    pokemonDetailModal.style.display = "none";
  }
  if (event.target === detailSectionModal) {
    detailSectionModal.style.display = "none";
  }
});

detailSectionCloseButton.addEventListener("click", () => {
  detailSectionModal.style.display = "none";
});

// Event listeners for other data cards (Explora más el Mundo Pokémon)
dataCards.forEach((card) => {
  card.addEventListener("click", () => {
    const section = card.dataset.section;
    switch (section) {
      case "locations":
        fetchAndDisplayLocations();
        break;
      case "berries":
        fetchAndDisplayBerries();
        break;
      case "items":
        fetchAndDisplayItems();
        break;
      // case 'machines': // Eliminado: Ya no se manejará esta sección
      //     fetchAndDisplayMachines();
      //     break;
      default:
        console.warn("Unknown section clicked:", section);
    }
  });
});

// --- Initialization ---

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingMessage();

  try {
    await Promise.all([
      fetchAllPokemonNamesAndUrls(),
      fetchGenerations(),
      fetchRegions(),
      fetchAllItems(),
      fetchAllBerries(),
      // Eliminado: fetchAllMachines()
    ]);

    await populateTypeFilters();
    await populateGenerationFilter();
    await populateRegionFilter();

    await applyFilters();
  } catch (error) {
    console.error("Project initialization failed:", error);
    loadingMessage.innerHTML =
      "¡Ups! Hubo un problema al cargar los datos iniciales.<br>Por favor, recarga la página e inténtalo de nuevo.";
    hideLoadingMessage();
    document.getElementById("paginationControls").style.display = "none";
    document.getElementById("filtersContainer").style.display = "none";
  }
});
