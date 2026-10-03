import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function MeetingDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("AGENDA"); // AGENDA, RSVPS, ATTENDANCE, MINUTES

  const { data: meetingData, isLoading } = useQuery({
    queryKey: ['meetings', id],
    queryFn: async () => {
      // API endpoint: GET /meetings/:id
      const res = await fetch(`/api/v1/meetings/${id}`);
      if (!res.ok) throw new Error("Failed to fetch meeting");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading meeting details...</div>;
  if (!meetingData?.data) return <div className="p-12 text-center text-[var(--color-stop)]">Meeting not found.</div>;

  const meeting = meetingData.data;
  
  // Fallback defaults for missing nested data structure if needed
  const agenda = meeting.agenda || [];
  const rsvps = meeting.rsvps || [];
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/manage/meetings" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-4">
          &larr; Back to Meetings
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)] mb-2">{meeting.title}</h1>
            <p className="text-sm text-[var(--color-muted)] flex items-center gap-4">
              <span>📅 {new Date(meeting.scheduledAt).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>📍 {meeting.location}</span>
            </p>
          </div>
          {meeting.isRequired && (
            <span className="bg-[var(--color-stop)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-[6px]">
              Mandatory
            </span>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] shadow-sm flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-[var(--color-line)] overflow-x-auto bg-[var(--color-paper)] rounded-t-[10px]">
          {['AGENDA', 'RSVPS', 'ATTENDANCE', 'MINUTES'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[var(--color-dusk)] border-b-2 border-[var(--color-dusk)] bg-white' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-gray-50'}`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 bg-white">
          
          {activeTab === 'AGENDA' && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">Meeting Agenda</h2>
              {agenda.length === 0 ? (
                <p className="text-[var(--color-muted)] text-sm">No agenda provided for this meeting.</p>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {agenda.map((item, i) => (
                    <div key={item.id || i} className="flex gap-4 p-4 rounded-[6px] border border-[var(--color-line)] bg-gray-50 items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-dusk)] text-white flex items-center justify-center font-bold font-mono text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--color-ink)]">{item.topic}</p>
                        <p className="text-xs text-[var(--color-muted)] mt-1">{item.owner || "No owner assigned"}</p>
                      </div>
                      <div className="font-mono text-sm text-[var(--color-ink)] font-bold bg-white px-3 py-1 rounded border border-[var(--color-line)]">
                        {item.minutes} min
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'RSVPS' && (
            <div>
              <div className="flex justify-between items-center mb-6 max-w-4xl">
                <h2 className="text-lg font-bold text-[var(--color-ink)]">RSVP Status</h2>
                <div className="flex gap-4 text-sm font-mono">
                  <span className="text-[var(--color-ok)]">{rsvps.filter(r => r.status === 'YES').length} Yes</span>
                  <span className="text-[var(--color-stop)]">{rsvps.filter(r => r.status === 'NO').length} No</span>
                  <span className="text-[var(--color-wait)]">{rsvps.filter(r => r.status === 'PENDING').length} Pending</span>
                </div>
              </div>
              
              <div className="max-w-4xl border border-[var(--color-line)] rounded-[6px] overflow-hidden">
                <table className="min-w-full divide-y divide-[var(--color-line)]">
                  <thead className="bg-[var(--color-paper)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase">Role</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line)]">
                    {rsvps.length === 0 ? (
                      <tr><td colSpan="3" className="p-8 text-center text-sm text-[var(--color-muted)]">No invites sent.</td></tr>
                    ) : rsvps.map((rsvp, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--color-ink)]">{rsvp.user.name}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-muted)]">{rsvp.role}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase rounded ${
                            rsvp.status === 'YES' ? 'bg-[var(--color-ok)] text-white' :
                            rsvp.status === 'NO' ? 'bg-[var(--color-stop)] text-white' :
                            'bg-[var(--color-wait)] text-white'
                          }`}>
                            {rsvp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === 'ATTENDANCE' || activeTab === 'MINUTES') && (
            <div className="text-center py-20 text-[var(--color-muted)]">
              <p>This tab is active during and after the meeting.</p>
              <button className="mt-4 bg-white border border-[var(--color-dusk)] text-[var(--color-dusk)] px-4 py-2 rounded-[6px] text-sm font-medium">
                {activeTab === 'ATTENDANCE' ? 'Start taking attendance' : 'Draft minutes'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
