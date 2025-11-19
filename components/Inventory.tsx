import React from 'react';
import { useGame } from '../context/GameContext';
import { Item, ItemSlot, ItemRarity } from '../types';

const ItemCard: React.FC<{ item: Item, isEquipped: boolean }> = ({ item, isEquipped }) => {
  const { equipItem, unequipItem, sellItem } = useGame();

  return (
    <div className={`p-3 rounded border flex flex-col gap-2 relative group
      ${item.rarity === ItemRarity.Legendary ? 'border-orange-500 bg-orange-900/10' : 
        item.rarity === ItemRarity.Epic ? 'border-purple-500 bg-purple-900/10' :
        item.rarity === ItemRarity.Rare ? 'border-blue-500 bg-blue-900/10' :
        'border-neutral-700 bg-neutral-800'}`}>
        
        <div className="flex items-start gap-2">
            <img src={item.icon} className="w-10 h-10 rounded bg-neutral-900" alt="icon" />
            <div>
                <div className={`font-bold text-sm ${
                     item.rarity === ItemRarity.Legendary ? 'text-orange-400' : 
                     item.rarity === ItemRarity.Epic ? 'text-purple-400' :
                     item.rarity === ItemRarity.Rare ? 'text-blue-400' : 'text-neutral-300'
                }`}>{item.name}</div>
                <div className="text-[10px] text-neutral-500 uppercase">{item.rarity} {item.slot}</div>
            </div>
        </div>

        <div className="text-xs space-y-1 text-neutral-400">
            {item.damageMin && <div>Dmg: {item.damageMin}-{item.damageMax}</div>}
            {item.armor && <div>Armor: {item.armor}</div>}
            {Object.entries(item.stats).map(([key, val]) => (
                <div key={key}>+{val} {key}</div>
            ))}
            <div className="text-yellow-600 mt-1">Val: {item.value} 💰</div>
        </div>

        <div className="mt-auto pt-2 flex gap-2">
            {isEquipped ? (
                <button 
                    onClick={() => unequipItem(item.slot)}
                    className="flex-1 py-1 bg-neutral-700 hover:bg-neutral-600 text-xs rounded"
                >
                    Unequip
                </button>
            ) : (
                <>
                <button 
                    onClick={() => equipItem(item)}
                    className="flex-1 py-1 bg-green-800 hover:bg-green-700 text-xs rounded text-green-100"
                >
                    Equip
                </button>
                <button 
                    onClick={() => sellItem(item.id)}
                    className="px-2 py-1 bg-red-900/50 hover:bg-red-900 text-xs rounded text-red-200"
                >
                    Sell
                </button>
                </>
            )}
        </div>
    </div>
  );
};

const Inventory = () => {
  const { player } = useGame();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipped Section */}
        <div className="lg:col-span-1">
            <h2 className="text-2xl font-serif text-rome-gold mb-4">Equipped Gear</h2>
            <div className="space-y-2">
                {Object.values(ItemSlot).map(slot => {
                    const item = player.equipped[slot];
                    return item ? (
                        <ItemCard key={slot} item={item} isEquipped={true} />
                    ) : (
                        <div key={slot} className="p-4 border border-dashed border-neutral-700 rounded text-neutral-600 text-center uppercase text-xs">
                            {slot} Slot Empty
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Inventory Section */}
        <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif text-rome-gold">Backpack</h2>
                <span className="text-neutral-400 text-sm">{player.inventory.length} Items</span>
            </div>
            
            {player.inventory.length === 0 ? (
                <div className="p-12 border border-neutral-800 rounded bg-neutral-900/50 text-center text-neutral-500">
                    Your inventory is empty. Go on an expedition!
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {player.inventory.map(item => (
                        <ItemCard key={item.id} item={item} isEquipped={false} />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default Inventory;