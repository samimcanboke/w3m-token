import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

interface TimelockOperation {
  id: string;
  operation: string;
  params: any[];
  scheduledTime: number;
  executeTime: number;
  status: 'scheduled' | 'executed' | 'expired';
  txHash?: string;
}

interface TimelockManagerProps {
  contract: ethers.Contract;
  account: string;
  isOwner: boolean;
}

export const TimelockManager: React.FC<TimelockManagerProps> = ({
  contract,
  account,
  isOwner
}) => {
  const [operations, setOperations] = useState<TimelockOperation[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for timelock events
  useEffect(() => {
    if (!contract) return;

    const handleTimelockScheduled = (operationId: string, executeTime: number, event: any) => {
      const newOperation: TimelockOperation = {
        id: operationId,
        operation: 'Unknown', // We'll decode this from transaction data
        params: [],
        scheduledTime: Date.now() / 1000,
        executeTime: executeTime,
        status: 'scheduled',
        txHash: event.transactionHash
      };

      setOperations(prev => [...prev, newOperation]);
      
      toast.info(`⏰ Operation scheduled for execution in 24 hours`, {
        position: "top-right",
        autoClose: 5000,
      });
    };

    const handleTimelockExecuted = (operationId: string, event: any) => {
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'executed' as const, txHash: event.transactionHash }
            : op
        )
      );

      toast.success(`✅ Timelock operation executed successfully!`, {
        position: "top-right",
        autoClose: 5000,
      });
    };

    // Set up event listeners
    contract.on('TimelockScheduled', handleTimelockScheduled);
    contract.on('TimelockExecuted', handleTimelockExecuted);

    // Cleanup
    return () => {
      contract.off('TimelockScheduled', handleTimelockScheduled);
      contract.off('TimelockExecuted', handleTimelockExecuted);
    };
  }, [contract]);

  // Execute a timelock operation
  const executeTimelockOperation = async (operation: TimelockOperation) => {
    if (!contract || !isOwner) return;

    setLoading(true);
    try {
      // This would need to be customized based on the specific operation
      // For now, we'll show a generic example for emergency withdraw
      
      const currentTime = Date.now() / 1000;
      if (currentTime < operation.executeTime) {
        toast.error(`⏰ Operation not ready for execution. Wait until ${new Date(operation.executeTime * 1000).toLocaleString()}`);
        return;
      }

      // Example: Re-call the same function that was originally called
      // In a real implementation, you'd store the function signature and parameters
      toast.info('🔄 Executing timelock operation...', { autoClose: false });
      
      // This is where you'd call the actual function again
      // The contract will recognize it's the second call and execute
      
    } catch (error: any) {
      console.error('Timelock execution error:', error);
      if (error.message.includes('Timelock period not expired')) {
        toast.error('⏰ Timelock period has not expired yet');
      } else {
        toast.error(`❌ Failed to execute: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (executeTime: number) => {
    const now = Date.now() / 1000;
    const remaining = executeTime - now;
    
    if (remaining <= 0) return 'Ready to execute';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return `${hours}h ${minutes}m remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-yellow-600';
      case 'executed': return 'text-green-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">Only contract owner can view timelock operations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ⏰ Timelock Operations
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How Timelock Works
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>First call schedules the operation (24-hour delay)</li>
                  <li>Second call (after delay) executes the operation</li>
                  <li>This provides transparency and community review time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {operations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No timelock operations scheduled.</p>
        ) : (
          <div className="space-y-4">
            {operations.map((operation) => (
              <div key={operation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {operation.operation}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(operation.status)} bg-gray-100`}>
                        {operation.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Scheduled: {new Date(operation.scheduledTime * 1000).toLocaleString()}</p>
                      <p>Execute After: {new Date(operation.executeTime * 1000).toLocaleString()}</p>
                      <p className="font-medium">{formatTimeRemaining(operation.executeTime)}</p>
                    </div>

                    {operation.txHash && (
                      <a 
                        href={`https://etherscan.io/tx/${operation.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>

                  <div className="ml-4">
                    {operation.status === 'scheduled' && Date.now() / 1000 >= operation.executeTime && (
                      <button
                        onClick={() => executeTimelockOperation(operation)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {loading ? '⏳' : '▶️'} Execute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Specific timelock operation components
export const EmergencyWithdrawTimelock: React.FC<{
  contract: ethers.Contract;
  isOwner: boolean;
}> = ({ contract, isOwner }) => {
  const [amount, setAmount] = useState('');
  const [burnTokens, setBurnTokens] = useState(false);
  const [loading, setLoading] = useState(false);

  const scheduleEmergencyWithdraw = async () => {
    if (!contract || !isOwner || !amount) return;

    setLoading(true);
    try {
      const amountWei = ethers.utils.parseUnits(amount, 6); // USDC has 6 decimals
      
      toast.info('⏰ Scheduling emergency withdraw (24h timelock)...', { autoClose: false });
      
      const tx = await contract.emergencyWithdrawUSDC(amountWei, burnTokens);
      
      toast.dismiss();
      toast.success('✅ Emergency withdraw scheduled! Execute again after 24 hours.', {
        autoClose: 8000,
      });
      
      setAmount('');
      setBurnTokens(false);
      
    } catch (error: any) {
      console.error('Schedule error:', error);
      toast.dismiss();
      
      if (error.message.includes('Operation scheduled')) {
        toast.success('✅ Operation scheduled successfully!');
      } else {
        toast.error(`❌ Failed to schedule: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="text-lg font-medium text-red-900 mb-4">
        🚨 Emergency USDC Withdraw (Timelock)
      </h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount (USDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            placeholder="Enter USDC amount"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={burnTokens}
              onChange={(e) => setBurnTokens(e.target.checked)}
              className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200"
            />
            <span className="ml-2 text-sm text-gray-700">
              Burn tokens to maintain price (recommended)
            </span>
          </label>
        </div>

        <button
          onClick={scheduleEmergencyWithdraw}
          disabled={loading || !amount}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-md font-medium"
        >
          {loading ? '⏳ Scheduling...' : '⏰ Schedule Emergency Withdraw'}
        </button>

        <p className="text-xs text-red-700">
          ⚠️ This will require a 24-hour waiting period before execution.
        </p>
      </div>
    </div>
  );
};