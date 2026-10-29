<script lang="ts" module>
	import type { Api, ColumnOptions, Config } from 'datatables.net-dt';

	export type Column = ColumnOptions & { title: string };

	// DataTables (v3, no jQuery) and its extensions load in the browser on first use.
	let loading: Promise<typeof import('datatables.net-dt').default> | undefined;
	function loadDataTables() {
		loading ??= (async () => {
			const { default: DataTable } = await import('datatables.net-dt');
			await Promise.all([
				import('datatables.net-dt/css/dataTables.dataTables.css'),
				import('datatables.net-buttons-dt'),
				import('datatables.net-buttons-dt/css/buttons.dataTables.css'),
				import('datatables.net-buttons/js/buttons.html5.mjs'),
				import('datatables.net-buttons/js/buttons.colVis.mjs'),
				// SearchBuilder needs DateTime for its date filters (it alerts without it).
				import('datatables.net-datetime'),
				import('datatables.net-datetime/css'),
				import('datatables.net-searchbuilder-dt'),
				import('datatables.net-searchbuilder-dt/css/searchBuilder.dataTables.css'),
				import('datatables.net-select-dt'),
				import('datatables.net-select-dt/css/select.dataTables.css'),
				import('datatables.net-responsive-dt'),
				import('datatables.net-responsive-dt/css/responsive.dataTables.css')
			]);
			return DataTable;
		})();
		return loading;
	}
</script>

<script lang="ts" generics="Row extends Record<string, unknown>">
	import { onMount } from 'svelte';

	/*
	 * A DataTables table: search, SearchBuilder filters, column visibility, CSV export, and
	 * optionally row selection. Pass plain row objects; `columns[].data` names their properties.
	 */
	let {
		columns,
		rows,
		exportName = 'export',
		selectable = false,
		searchBuilder = true,
		order = [],
		pageLength = 25,
		onRowClick,
		onSelectionChange
	}: {
		columns: Column[];
		rows: Row[];
		/** File name for the CSV export, without the extension. */
		exportName?: string;
		selectable?: boolean;
		searchBuilder?: boolean;
		/** Initial sort, as [columnIndex, 'asc' | 'desc'] pairs (indexes count the select column). */
		order?: [number, 'asc' | 'desc'][];
		pageLength?: number;
		onRowClick?: (row: Row) => void;
		onSelectionChange?: (rows: Row[]) => void;
	} = $props();

	let table: HTMLTableElement;
	let api = $state<Api<Row>>();
	let failed = $state(false);

	onMount(() => {
		let destroyed = false;
		loadDataTables()
			.then((DataTable) => {
				if (destroyed) return;
				const exportColumns = selectable ? ':visible:not(.dt-select)' : ':visible';
				const config: Config = {
					data: rows,
					columns: [
						...(selectable
							? [
									{
										data: null,
										title: '',
										orderable: false,
										searchable: false,
										render: DataTable.render.select(),
										className: 'dt-select'
									}
								]
							: []),
						// DataTables inserts cell data as HTML. Answers come from the public, so escape
						// every column that doesn't bring its own renderer.
						...columns.map((column) => ({ render: DataTable.render.text(), ...column }))
					],
					order,
					pageLength,
					lengthMenu: [10, 25, 50, 100, 500],
					autoWidth: false,
					responsive: false,
					scrollX: true,
					select: selectable ? { style: 'multi+shift', selector: 'td.dt-select' } : false,
					searchBuilder: searchBuilder
						? { columns: columns.map((_, i) => i + (selectable ? 1 : 0)) }
						: undefined,
					buttons: [
						{
							extend: 'csvHtml5',
							text: 'Export CSV',
							title: exportName,
							exportOptions: { columns: exportColumns }
						},
						{
							extend: 'colvis',
							text: 'Columns',
							columns: selectable ? ':not(.dt-select)' : undefined
						}
					],
					layout: {
						top2Start: 'buttons',
						top1: searchBuilder ? 'searchBuilder' : null,
						topStart: 'pageLength',
						topEnd: 'search',
						bottomStart: 'info',
						bottomEnd: 'paging'
					},
					language: {
						search: 'Search',
						emptyTable: 'Nothing here yet.',
						zeroRecords: 'No rows match.',
						searchBuilder: { button: 'Filters', title: { 0: 'Filters', _: 'Filters (%d)' } }
					}
				} as Config;
				const instance = new DataTable<Row>(table, config);
				instance.on('select deselect', () => {
					onSelectionChange?.(instance.rows({ selected: true }).data().toArray());
				});
				api = instance;
			})
			.catch((error) => {
				console.error('DataTables failed to load', error);
				failed = true;
			});
		return () => {
			destroyed = true;
			api?.destroy();
		};
	});

	// New rows (after a delete or import) replace the old ones, keeping filters and sort.
	$effect(() => {
		const data = rows;
		if (!api) return;
		api.clear().rows.add(data).draw(false);
		onSelectionChange?.([]);
	});

	function handleClick(event: MouseEvent) {
		if (!onRowClick || !api) return;
		const target = event.target as HTMLElement;
		if (target.closest('td.dt-select, a, button, input')) return;
		const tr = target.closest('tbody tr');
		const row = tr && api.row(tr as HTMLTableRowElement).data();
		if (row) onRowClick(row);
	}

	export function deselectAll() {
		api?.rows().deselect();
	}
</script>

<div class="data-table" class:clickable={!!onRowClick}>
	{#if failed}<p class="flash flash-error">
			The table failed to load. Try reloading the page.
		</p>{/if}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<table bind:this={table} class="display" style="width: 100%" onclick={handleClick}></table>
</div>

<style>
	/* DataTables' own variables, in the site's green rather than its default blue. */
	.data-table {
		--dt_background-selected: 0, 122, 46;
		--dt-row_background-selected: 0, 122, 46;
		font-size: 0.9rem;
	}

	/* The admin's full-width input styles don't suit the table's small controls. */
	.data-table :global(.dt-length select),
	.data-table :global(.dt-search input) {
		width: auto;
		display: inline-block;
		margin: 0 0.4rem;
	}

	/* Questions make long headers: give columns room, and cut headers off after three lines. */
	.data-table :global(thead th) {
		min-width: 9rem;
		vertical-align: bottom;
	}

	.data-table :global(thead th.dt-select) {
		min-width: 0;
	}

	.data-table :global(thead .dt-column-title) {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.data-table.clickable :global(tbody tr) {
		cursor: pointer;
	}

	.data-table :global(.dt-buttons .dt-button),
	.data-table :global(.dtsb-button) {
		border-radius: 8px;
		font-weight: 600;
	}

	.data-table :global(div.dt-container .dt-search input),
	.data-table :global(div.dt-container .dt-length select) {
		border-radius: 8px;
		padding: 0.35rem 0.6rem;
	}

	.data-table :global(table.dataTable td) {
		max-width: 28rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
