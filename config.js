import { @Vigilant, @TextProperty, @ColorProperty, @ButtonProperty, @SwitchProperty, @SliderProperty, Color } from 'Vigilance';

@Vigilant("CataHover")
class Settings {
	
	@SwitchProperty({
		name: "Cata Level in Join Message",
		description: "Enable or disable appending the cata level to the message when a player joins the dungeon party",
		category: "General",
		subcategory: "General"
	})
	editJoinMsg = true;
	
	@SwitchProperty({
		name: "Party Finder Overlay",
		description: "Choose whether or not to render the party finder overlay",
		category: "General",
		subcategory: "Overlay"
	})
	overlayEnabled = true;
	
	@ButtonProperty({
        name: "Edit Position",
        description: "Edit the position of the overlay on the screen",
        category: "General",
        subcategory: "Overlay",
		placeholder: "Edit"
    })
	editPos() {
		ChatLib.command("cho gui", true);
	}
	
	@SliderProperty({
		name: "Border Thickness",
		description: "Thickness of the main border in the overlay",
		category: "General",
		subcategory: "Overlay",
		min: 0,
		max: 20
	})
	borderThickness = 8;
	
	@ColorProperty({
		name: "Border Color",
		description: "Color of the main border in the overlay",
		category: "General",
		subcategory: "Overlay"
	})
	borderColor = new Color(0, 0, 0, 0.5);
	
	@SliderProperty({
		name: "Shadow Thickness",
		description: "Thickness of the smaller shadow in the overlay",
		category: "General",
		subcategory: "Overlay",
		min: 0,
		max: 5
	})
	shadowThickness = 1;
	
	@ColorProperty({
		name: "Shadow Color",
		description: "Color of the smaller shadow in the overlay",
		category: "General",
		subcategory: "Overlay"
	})
	shadowColor = new Color(Color.GRAY.getRed() / 255, Color.GRAY.getGreen() / 255, Color.GRAY.getBlue() / 255, 0.5);
	
	@ColorProperty({
		name: "Main Color",
		description: "Color of the main background in the overlay",
		category: "General",
		subcategory: "Overlay"
	})
	mainColor = new Color(Color.DARK_GRAY.getRed() / 255, Color.DARK_GRAY.getGreen() / 255, Color.DARK_GRAY.getBlue() / 255, 0.5);;
	
	@SwitchProperty({
		name: "Text Shadow",
		description: "Text shadow option for the text in the overlay",
		category: "General",
		subcategory: "Overlay"
	})
	textShadow = true;
	
	@TextProperty({
        name: "API Key",
        description: "Hypixel API Key",
        category: "API Key",
        subcategory: "API",
        placeholder: ""
    })
    apiKey = "";
	
	constructor() {
        this.initialize(this);
    }
}

export default new Settings();