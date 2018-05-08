import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Note from './Note';
import { EmojiIcon } from './reuseables';
import SettingsPanel from './SettingsPanel';
import * as storage from '../storage_api';
import {
	createNote,
} from '../helpers';
import {
	NIGHT_BG_COLOR,
	DEFAULT_STORAGE_STATE,
} from '../CONSTANTS';

import './Board.css';


export const ThemeContext = React.createContext();

export default class NotesBoard extends React.Component {
	state = {
		...DEFAULT_STORAGE_STATE,
		showSettings: false,
		catchedError: false,
	};

	async componentDidMount() {
		// listen to ctr+enter to add new
		document.addEventListener('keydown',this.keydownHandler);
		// load storage state
		const storageState = await storage.load();

		this.setState(
			prevState => ({...prevState, ...storageState})
		);
	}

  componentWillUnmount() {
		// not really needed here ...but just to enforce practice
    document.removeEventListener('keydown',this.keydownHandler);
	}

	componentDidCatch(err, info) {
		console.error(err);
		console.info(info);
    this.setState({ catchedError: true });
	}

	// storage api calls
	saveToStore = obj => {
		this.setState(
		 	prevState => ({...prevState, ...obj}),
			() => storage.save(obj)
		)
	};

	toggleSettings = () => this.setState({showSettings: !this.state.showSettings});

	// updates noteStyle and/or boardStyle
	updateDefaultStyles = (styleFor='noteStyle', newProp={}) => {
		const updatedProps = {
			...this.state[styleFor],
			...newProp
		};
		this.saveToStore({[styleFor]: updatedProps});
	};

	// reSortNotes = () => {
	// 	const removeFixedStyle = note => ({...note, style: {}});
	// 	const updatedNotes = this.state.notes.map(removeFixedStyle);
	// 	this.saveToStore({notes: updatedNotes});
	// }

	keydownHandler = evt => {
		// ctr + enter
		if ( evt.keyCode === 13 && evt.ctrlKey ) {
			this.addNewNote();
		}
	};

	addNewNote = () => {
		const note = createNote();
		this.saveToStore({notes: [...this.state.notes, note]});
	};

	updateNote = updatedNote => {
		const notes = this.state.notes.map(note => (note.id === updatedNote.id) ? updatedNote : note);
		this.saveToStore({notes});
	};

	removeNote = id  => {
		const notes = this.state.notes.filter(note => note.id !== id);
		this.saveToStore({notes});
	};

	render() {
		const {
			notes,
			noteStyle,
			boardStyle,
			showSettings,
			catchedError,
		} = this.state;

		if ( catchedError ) {
			return <EmojiIcon>Ops! Something went wrong 😥</EmojiIcon>
		}

		const noteBoxes = notes.map( note =>
			<Note
				key={note.id}
				note={note}
				updateFn={this.updateNote}
				removeFn={this.removeNote}
			/>
		);

		return (
			<div
				style={{background: `${boardStyle.nightMode ? NIGHT_BG_COLOR : ''}`}}
				className='notes-board'
			>
				<ThemeContext.Provider
					value={{
						defaultNoteStyle: noteStyle,
						defaultBoardStyle: boardStyle,
						updateNoteStyle: newProps => this.updateDefaultStyles('noteStyle' , newProps),
						updateBoardStyle: newProps => this.updateDefaultStyles('boardStyle' , newProps),
					}}
				>
					<ReactCSSTransitionGroup
						transitionName='note'
						transitionAppear
						transitionEnter
						transitionAppearTimeout={500}
						transitionEnterTimeout={500}
						transitionLeaveTimeout={300}
					>
						{noteBoxes}
					</ReactCSSTransitionGroup>

					<EmojiIcon
						className='plus-sign-emoji'
						title='New note (ctr + ⏎)'
						aria-label='heavy plus sign'
						onClick={this.addNewNote}
					>
						➕
					</EmojiIcon>
					
					<SettingsPanel show={showSettings} toggle={value=>this.setState({showSettings: value})}/>

				</ThemeContext.Provider>
			</div>
		);
	}
}
