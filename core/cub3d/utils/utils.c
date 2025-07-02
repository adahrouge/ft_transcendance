/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utils.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 20:54:36 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 13:10:58 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

void free_2d_array(char **array)
{
	int i;

	i = 0;
	while (array[i])
	{
		free(array[i]);
		i++;
	}
	free(array);
}
void error_message(char *str)
{
	write(2, str, ft_strlen(str));
	return ;
}

void exit_and_error(t_data *p)
{
	error_message(p->error_message);
	free_allocated(p);
	exit(EXIT_FAILURE);
}
void free_allocated(t_data *p)
{
	if (p->map_filename)
		free(p->map_filename);
	if (p->north_filename)
		free(p->north_filename);
	if (p->east_filename)
		free(p->east_filename);
	if (p->west_filename)
		free(p->west_filename);
	if (p->south_filename)
		free(p->south_filename);
	if (p->map_content)
		free_2d_array(p->map_content);
	if (p->floor_color)
		free(p->floor_color);
	if (p->ceiling_color)
		free(p->ceiling_color);
	if (p->map)
		free_2d_array(p->map);
	if (p)
		free(p);
}
