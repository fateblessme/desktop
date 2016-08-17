import * as React from 'react'
import List from '../list'
import { Dispatcher } from '../../lib/dispatcher'
import Repository from '../../models/repository'
import { Branch } from '../../lib/local-git-operations'
import { groupedAndFilteredBranches, BranchListItem } from './grouped-and-filtered-branches'

const RowHeight = 25

interface IBranchesProps {
  readonly defaultBranch: Branch | null
  readonly currentBranch: Branch | null
  readonly allBranches: ReadonlyArray<Branch>
  readonly recentBranches: ReadonlyArray<Branch>
  readonly dispatcher: Dispatcher
  readonly repository: Repository
}

interface IBranchesState {
  readonly filter: string
  readonly selectedRow: number
}

export default class Branches extends React.Component<IBranchesProps, IBranchesState> {
  private list: List | null = null
  private scrollToRow = -1

  public constructor(props: IBranchesProps) {
    super(props)

    this.state = { filter: '', selectedRow: -1 }
  }

  public componentDidMount() {
    this.props.dispatcher.loadBranches(this.props.repository)
  }

  private renderRow(branchItems: ReadonlyArray<BranchListItem>, row: number) {
    const item = branchItems[row]
    if (item.kind === 'branch') {
      const branch = item.branch
      return <div className='branches-list-content branches-list-item'>{branch.name}</div>
    } else {
      return <div className='branches-list-content branches-list-label'>{item.label}</div>
    }
  }

  private onSelectionChanged(branchItems: ReadonlyArray<BranchListItem>, row: number) {
    const item = branchItems[row]
    if (item.kind !== 'branch') { return }

    const branch = item.branch
    this.props.dispatcher.closePopup()
    this.props.dispatcher.checkoutBranch(this.props.repository, branch.name)
  }

  private canSelectRow(branchItems: ReadonlyArray<BranchListItem>, row: number) {
    const item = branchItems[row]
    return item.kind === 'branch'
  }

  private onFilterChanged(event: React.FormEvent<HTMLInputElement>) {
    const text = event.target.value
    this.setState({ filter: text, selectedRow: this.state.selectedRow })
  }

  private onKeyDown(branchItems: ReadonlyArray<BranchListItem>, event: React.KeyboardEvent<HTMLInputElement>) {
    const list = this.list
    if (!list) { return }

    console.log(event.key)

    let nextRow = this.state.selectedRow
    if (event.key === 'ArrowDown') {
      nextRow = list.nextSelectableRow('down', this.state.selectedRow)
    } else if (event.key === 'ArrowUp') {
      nextRow = list.nextSelectableRow('up', this.state.selectedRow)
    } else if (event.key === 'Enter') {
      this.onSelectionChanged(branchItems, this.state.selectedRow)
    } else if (event.key === 'Escape') {
      if (this.state.filter.length === 0) {
        this.props.dispatcher.closePopup()
        return
      }
    } else {
      return
    }

    this.scrollToRow = nextRow
    this.setState({ selectedRow: nextRow, filter: this.state.filter })
  }

  public render() {
    const scrollToRow = this.scrollToRow
    this.scrollToRow = -1

    const branchItems = groupedAndFilteredBranches(this.props.defaultBranch, this.props.currentBranch, this.props.allBranches, this.props.recentBranches, this.state.filter)
    return (
      <div id='branches' className='panel'>
        <input type='search'
               autoFocus={true}
               placeholder='Filter'
               onChange={event => this.onFilterChanged(event)}
               onKeyDown={event => this.onKeyDown(branchItems, event)}/>

        <div className='panel popup-content branches-list-container'>
          <List rowCount={branchItems.length}
                rowRenderer={row => this.renderRow(branchItems, row)}
                rowHeight={RowHeight}
                selectedRow={this.state.selectedRow}
                onSelectionChanged={row => this.onSelectionChanged(branchItems, row)}
                canSelectRow={row => this.canSelectRow(branchItems, row)}
                scrollToRow={scrollToRow}
                ref={ref => this.list = ref}/>
        </div>
      </div>
    )
  }
}
