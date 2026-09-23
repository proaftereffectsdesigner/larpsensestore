"use client";

import { useState, useMemo } from "react";
import { 
  Search, ShoppingBag, Filter, ArrowUpDown, Copy, 
  ExternalLink, Check, Eye, X, ChevronLeft, ChevronRight, 
  Calendar, Mail, User, Gamepad2, TrendingUp, Euro,
  Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle,
  Download, FileText, Shield, Wallet, Zap
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useCurrency } from "@/lib/CurrencyContext";

export interface OrderItem {
  id: string;
  user_id: string;
  email: string;
  display_name?: string | null;
  product_id: string;
  product_name: string;
  game: string;
  quantity: number;
  total_price: number;
  unit_cost: number;
  total_cost: number;
  profit: number;
  status: string;
  created_at: string;
  accounts_data?: string | null;
  nfa_order_id?: number | null;
  payment_method?: string;
  is_topup?: boolean;
}

interface OrdersTableProps {
  orders: OrderItem[];
}

export default function OrdersTable({ orders = [] }: OrdersTableProps) {
  const { convert, currency, isSuffix } = useCurrency();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAccounts, setCopiedAccounts] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAccounts = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccounts(true);
    setTimeout(() => setCopiedAccounts(false), 2000);
  };

  // Helper format price
  const formatPrice = (amountEur: number) => {
    return convert(amountEur).formatted;
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw className="w-3.5 h-3.5" /> Refunded
          </span>
        );
      case "cancelled":
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status Filter
        if (statusFilter !== "all" && order.status.toLowerCase() !== statusFilter) {
          return false;
        }

        // Type Filter
        if (typeFilter === "products" && order.product_id === "topup") {
          return false;
        }
        if (typeFilter === "topup" && order.product_id !== "topup") {
          return false;
        }

        // Game Filter
        if (gameFilter !== "all") {
          if (order.product_id === "topup") return false;
          const game = order.game?.toLowerCase() || "";
          const prodId = order.product_id?.toLowerCase() || "";
          if (gameFilter === "cs2" && !(game === "cs2" || prodId.startsWith("prime") || prodId.startsWith("premier"))) return false;
          if (gameFilter === "rust" && !(game === "rust" || prodId.startsWith("rust"))) return false;
          if (gameFilter === "extra" && !(game === "extra" || ["r6", "dayz", "bf6", "apex"].includes(prodId))) return false;
        }

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchEmail = (order.email || "").toLowerCase().includes(q);
          const matchName = (order.display_name || "").toLowerCase().includes(q);
          const matchId = (order.id || "").toLowerCase().includes(q);
          const matchProduct = (order.product_name || "").toLowerCase().includes(q) || (order.product_id || "").toLowerCase().includes(q);
          const matchNfa = order.nfa_order_id ? String(order.nfa_order_id).includes(q) : false;
          
          let matchDate = false;
          if (order.created_at) {
            try {
              const d = new Date(order.created_at);
              const formattedDate = format(d, "yyyy-MM-dd HH:mm:ss MMMM do").toLowerCase();
              matchDate = formattedDate.includes(q);
            } catch {}
          }

          let matchAccount = false;
          if (order.accounts_data) {
            matchAccount = order.accounts_data.toLowerCase().includes(q);
          }

          return matchEmail || matchName || matchId || matchProduct || matchNfa || matchDate || matchAccount;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date-asc":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "price-desc":
            return b.total_price - a.total_price;
          case "price-asc":
            return a.total_price - b.total_price;
          case "profit-desc":
            return b.profit - a.profit;
          case "date-desc":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [orders, searchQuery, statusFilter, typeFilter, gameFilter, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Metrics for filtered orders
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let completedCount = 0;

    filteredOrders.forEach((o) => {
      if (o.status === "completed") {
        if (o.product_id !== 'topup') {
          totalRevenue += o.total_price;
        }
        totalProfit += o.profit;
        completedCount++;
      }
    });

    return {
      totalRevenue,
      totalProfit,
      completedCount,
      totalOrders: filteredOrders.length
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-accent" /> Total Orders
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalOrders}</div>
          <div className="text-[11px] text-gray-500 mt-1">
            {metrics.completedCount} completed ({metrics.totalOrders > 0 ? Math.round((metrics.completedCount / metrics.totalOrders) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-blue-400" /> Total Volume
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(metrics.totalRevenue)}</div>
          <div className="text-[11px] text-gray-500 mt-1">From completed orders</div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Net Profit
          </div>
          <div className="text-2xl font-black text-emerald-400">+{formatPrice(metrics.totalProfit)}</div>
          <div className="text-[11px] text-gray-500 mt-1">After wholesale cost deduction</div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-purple-400" /> Average Value
          </div>
          <div className="text-2xl font-black text-white">
            {formatPrice(metrics.completedCount > 0 ? metrics.totalRevenue / metrics.completedCount : 0)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Per completed order</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex gap-3 items-center">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Email, Order ID, Product name, Date (e.g. 2026-08), NFA Ref..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#181818] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Selects */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] mr-1">Type:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'products', label: 'Accounts' },
              { id: 'topup', label: 'Top-Ups' }
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  setTypeFilter(t.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  typeFilter === t.id
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-[#181818] text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] mr-1">Status:</span>
            {["all", "completed", "pending", "refunded", "cancelled"].map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-[#181818] text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {st}
              </button>
            ))}

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">Game:</span>
            {["all", "cs2", "rust", "extra"].map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => {
                  setGameFilter(g);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                  gameFilter === g
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-[#181818] text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#181818] border border-white/10 text-gray-300 font-medium rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Highest Amount</option>
              <option value="price-asc">Lowest Amount</option>
              <option value="profit-desc">Highest Profit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181818] border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4 text-right">Total Price</th>
                <th className="py-3.5 px-4 text-right">Cost / Profit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-gray-600 mb-1" />
                      <p className="text-sm font-bold text-gray-400">No orders found</p>
                      <p className="text-xs text-gray-500">Try adjusting your search query or filters.</p>
                      {(searchQuery || statusFilter !== "all" || gameFilter !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setGameFilter("all");
                          }}
                          className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-accent transition-all"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const date = new Date(order.created_at);
                  const isCopied = copiedId === order.id;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-gray-300 font-mono text-[11px] group-hover:text-accent transition-colors font-bold">
                            {order.id.slice(0, 8)}...
                          </code>
                          <button
                            type="button"
                            title="Copy Order ID"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(order.id, order.id);
                            }}
                            className="p-1 text-gray-500 hover:text-white rounded transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {format(date, "MMM dd, yyyy")}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {format(date, "HH:mm:ss")}
                        </div>
                      </td>

                      {/* Customer Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-white font-medium truncate" title={order.email}>
                            {order.email}
                          </span>
                          {order.display_name && (
                            <span className="text-[10px] text-gray-500 truncate">
                              @{order.display_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {order.is_topup || order.product_id === "topup" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <Wallet className="w-3 h-3" /> TOP-UP
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
                              {order.game}
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span className="text-white font-bold whitespace-nowrap">
                              {order.product_name}
                            </span>
                            {order.payment_method && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                via {order.payment_method}
                              </span>
                            )}
                          </div>
                          {order.quantity > 1 && (
                            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                              x{order.quantity}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-white text-sm">
                        {formatPrice(order.total_price)}
                      </td>

                      {/* Cost / Profit */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className={`font-bold ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {order.profit > 0 ? '+' : ''}{formatPrice(order.profit)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Cost: {formatPrice(order.total_cost)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="View Full Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-accent/20 hover:text-accent text-gray-400 rounded-lg transition-colors border border-white/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/order/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Customer Receipt"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 bg-[#141414]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-white">{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of{" "}
              <strong className="text-white">{filteredOrders.length}</strong> orders
            </span>

            <div className="h-4 w-px bg-white/10 mx-2" />

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#1e1e1e] border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-40 disabled:hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-40 disabled:hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#121212] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Details</span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-mono font-black text-white">{selectedOrder.id}</h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedOrder.id, "modal-id")}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedId === "modal-id" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Placed on {format(new Date(selectedOrder.created_at), "MMMM do, yyyy 'at' HH:mm:ss")} (
                  {formatDistanceToNow(new Date(selectedOrder.created_at), { addSuffix: true })})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> Customer Info
                </div>
                <div className="text-sm font-bold text-white break-all flex items-center justify-between">
                  <span>{selectedOrder.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedOrder.email, "modal-email")}
                    className="p-1 text-gray-500 hover:text-white"
                  >
                    {copiedId === "modal-email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  User ID: {selectedOrder.user_id}
                </div>
                {selectedOrder.display_name && (
                  <div className="text-[11px] text-gray-400">
                    Display: <span className="text-white font-bold">{selectedOrder.display_name}</span>
                  </div>
                )}
              </div>

              {/* Financials Box */}
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Financial Summary
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Customer Paid:</span>
                  <span className="font-black text-white text-base">{formatPrice(selectedOrder.total_price)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Wholesale Cost:</span>
                  <span>{formatPrice(selectedOrder.total_cost)} ({formatPrice(selectedOrder.unit_cost)} / unit)</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 font-bold">
                  <span className="text-emerald-400">Net Profit:</span>
                  <span className="text-emerald-400">+{formatPrice(selectedOrder.profit)}</span>
                </div>
              </div>
            </div>

            {/* Product Purchased */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {selectedOrder.is_topup || selectedOrder.product_id === "topup" ? "Transaction Type" : "Product Purchased"}
                </div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  {selectedOrder.is_topup || selectedOrder.product_id === "topup" ? (
                    <span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" /> TOP-UP
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                      {selectedOrder.game}
                    </span>
                  )}
                  {selectedOrder.product_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedOrder.payment_method && (
                    <span className="text-accent font-bold mr-2">Payment: {selectedOrder.payment_method}</span>
                  )}
                  Product ID: <code className="text-gray-300">{selectedOrder.product_id}</code> | Quantity: <strong className="text-white">{selectedOrder.quantity}</strong>
                </div>
              </div>

              {selectedOrder.nfa_order_id && (
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">NFA Supplier Ref</div>
                  <div className="text-sm font-mono font-bold text-amber-400">#{selectedOrder.nfa_order_id}</div>
                </div>
              )}
            </div>

            {/* Accounts Delivered */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Delivered Accounts / Credentials
                </label>
                {selectedOrder.accounts_data && (
                  <button
                    type="button"
                    onClick={() => handleCopyAccounts(selectedOrder.accounts_data || "")}
                    className="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
                  >
                    {copiedAccounts ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAccounts ? "Copied All!" : "Copy Accounts Data"}
                  </button>
                )}
              </div>

              {selectedOrder.accounts_data ? (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 font-mono text-xs text-emerald-400/90 whitespace-pre-wrap max-h-52 overflow-y-auto break-all shadow-inner leading-relaxed">
                  {selectedOrder.accounts_data}
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-dashed border-white/10 rounded-2xl p-6 text-center text-gray-500 text-xs">
                  No account tokens delivered for this order (pending fulfillment or cancelled).
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <a
                href={`/order/${selectedOrder.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all"
              >
                <ExternalLink className="w-4 h-4 text-accent" /> Open Customer Receipt
              </a>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
