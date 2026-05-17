import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import FieldDefinitionsPage from '@/app/[locale]/dashboard/field-definitions/page';

const mockGetUserFieldDefs = vi.hoisted(() => vi.fn());
const mockCreateUserFieldDef = vi.hoisted(() => vi.fn());
const mockUpdateUserFieldDef = vi.hoisted(() => vi.fn());
const mockDeleteUserFieldDef = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getUserFieldDefs: mockGetUserFieldDefs,
  createUserFieldDef: mockCreateUserFieldDef,
  updateUserFieldDef: mockUpdateUserFieldDef,
  deleteUserFieldDef: mockDeleteUserFieldDef,
}));

const fd1 = { id: 'fd-1', scope: 'user', apiary_id: null, target: 'inspection', name: 'Honey yield', type: 'number', options: [], required: false, default_value: null, sort_order: 0 };
const fd2 = { id: 'fd-2', scope: 'user', apiary_id: null, target: 'hive', name: 'Wood type', type: 'select', options: ['Pine', 'Oak'], required: true, default_value: null, sort_order: 1 };

describe('FieldDefinitionsPage', () => {
  beforeEach(() => {
    mockGetUserFieldDefs.mockClear();
    mockCreateUserFieldDef.mockClear();
    mockUpdateUserFieldDef.mockClear();
    mockDeleteUserFieldDef.mockClear();
  });

  it('shows page title', async () => {
    mockGetUserFieldDefs.mockResolvedValue([]);
    render(<FieldDefinitionsPage />);
    expect(screen.getByText('fieldDefs.title')).toBeDefined();
  });

  it('shows empty state when no fields', async () => {
    mockGetUserFieldDefs.mockResolvedValue([]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => expect(screen.getByText('fieldDefs.empty')).toBeDefined());
  });

  it('renders field rows with name and type', async () => {
    mockGetUserFieldDefs.mockResolvedValue([fd1, fd2]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => expect(screen.getByText('Honey yield')).toBeDefined());
    expect(screen.getByText('Wood type')).toBeDefined();
  });

  it('shows create form when New Field button clicked', async () => {
    mockGetUserFieldDefs.mockResolvedValue([]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('fieldDefs.empty'));
    fireEvent.click(screen.getByText('fieldDefs.new'));
    expect(screen.getByText('fieldDefs.createTitle')).toBeDefined();
    expect(screen.getByText('fieldDefs.createBtn')).toBeDefined();
  });

  it('cancel hides the create form', async () => {
    mockGetUserFieldDefs.mockResolvedValue([]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('fieldDefs.empty'));
    fireEvent.click(screen.getByText('fieldDefs.new'));
    fireEvent.click(screen.getByText('fieldDefs.cancel'));
    expect(screen.queryByText('fieldDefs.createTitle')).toBeNull();
  });

  it('calls createUserFieldDef and appends new field on success', async () => {
    mockGetUserFieldDefs.mockResolvedValue([]);
    const newFd = { ...fd1, id: 'fd-new', name: 'New weight' };
    mockCreateUserFieldDef.mockResolvedValue(newFd);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('fieldDefs.empty'));
    fireEvent.click(screen.getByText('fieldDefs.new'));
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New weight' } });
    fireEvent.submit(screen.getByText('fieldDefs.createBtn').closest('form')!);
    await waitFor(() => expect(mockCreateUserFieldDef).toHaveBeenCalled());
    await waitFor(() => screen.getByText('fieldDefs.createSuccess'));
  });

  it('shows edit form when Edit button clicked', async () => {
    mockGetUserFieldDefs.mockResolvedValue([fd1]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('Honey yield'));
    fireEvent.click(screen.getByText('hive.inspectionEditBtn'));
    expect(screen.getByText('fieldDefs.saveBtn')).toBeDefined();
  });

  it('calls updateUserFieldDef on save', async () => {
    mockGetUserFieldDefs.mockResolvedValue([fd1]);
    const updated = { ...fd1, name: 'Updated yield' };
    mockUpdateUserFieldDef.mockResolvedValue(updated);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('Honey yield'));
    fireEvent.click(screen.getByText('hive.inspectionEditBtn'));
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Updated yield' } });
    fireEvent.submit(screen.getByText('fieldDefs.saveBtn').closest('form')!);
    await waitFor(() => expect(mockUpdateUserFieldDef).toHaveBeenCalledWith('fd-1', expect.objectContaining({ name: 'Updated yield' })));
    await waitFor(() => screen.getByText('fieldDefs.saveSuccess'));
  });

  it('shows delete confirmation row on delete click', async () => {
    mockGetUserFieldDefs.mockResolvedValue([fd1]);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('Honey yield'));
    fireEvent.click(screen.getByText('fieldDefs.deleteBtn'));
    expect(screen.getByText('fieldDefs.deleteConfirmText')).toBeDefined();
    expect(screen.getByText('fieldDefs.deleteConfirmBtn')).toBeDefined();
  });

  it('calls deleteUserFieldDef and removes row on confirm', async () => {
    mockGetUserFieldDefs.mockResolvedValue([fd1]);
    mockDeleteUserFieldDef.mockResolvedValue(undefined);
    render(<FieldDefinitionsPage />);
    await waitFor(() => screen.getByText('Honey yield'));
    fireEvent.click(screen.getByText('fieldDefs.deleteBtn'));
    fireEvent.click(screen.getByText('fieldDefs.deleteConfirmBtn'));
    await waitFor(() => expect(mockDeleteUserFieldDef).toHaveBeenCalledWith('fd-1'));
    await waitFor(() => expect(screen.queryByText('Honey yield')).toBeNull());
  });
});
